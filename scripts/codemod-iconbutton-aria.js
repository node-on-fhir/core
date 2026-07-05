// scripts/codemod-iconbutton-aria.js
// jscodeshift transform: adds aria-label to unlabeled icon-only IconButton elements.
// Derives the label from the child icon component name (e.g. DeleteIcon → "Delete").
//
// The AST is used only to LOCATE insertion points; the edit is a character-offset
// splice into the original source. This keeps diffs to pure aria-label insertions —
// root.toSource() reprints modified subtrees and eats blank lines/joins attribute
// lines, which pollutes blame across a hundred files (verified firsthand).
module.exports = function (file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // "ArrowForwardIcon" → "Arrow forward" (sentence case, per the task brief)
  function humanize(name) {
    const spaced = name.replace(/Icon$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
    return spaced.charAt(0).toUpperCase() +
      spaced.slice(1).toLowerCase();
  }

  const insertions = [];

  root.findJSXElements('IconButton').forEach(function (path) {
    const open = path.node.openingElement;
    const attrs = open.attributes || [];

    // Skip if already labeled (aria-label / aria-labelledby), or if props are
    // spread in ({...props} could carry a label — don't double-label).
    const hasLabel = attrs.some(function (a) {
      if (a.type === 'JSXSpreadAttribute') return true;
      return a.type === 'JSXAttribute' &&
        ['aria-label', 'aria-labelledby'].indexOf(a.name && a.name.name) !== -1;
    });
    if (hasLabel) return;

    // Find a single *Icon JSX child
    const iconChild = (path.node.children || []).find(function (c) {
      return c.type === 'JSXElement' &&
        c.openingElement.name.type === 'JSXIdentifier' &&
        /Icon$/.test(c.openingElement.name.name);
    });

    // Check if there is a non-empty text child (already labeled by visible text)
    const textChild = (path.node.children || []).some(function (c) {
      return c.type === 'JSXText' && c.value.trim().length > 0;
    });

    // Only transform buttons that have an icon child and no visible text
    if (!iconChild || textChild) return;

    // Prefer the wrapping Tooltip's title — it's the control's intended human
    // name ("Form", "Search for patient or group") and beats icon-name
    // humanization ("Edit note"). Fall back to the icon name otherwise.
    let label = null;
    const parent = path.parent && path.parent.node;
    if (parent && parent.type === 'JSXElement' &&
      parent.openingElement.name.type === 'JSXIdentifier' &&
      parent.openingElement.name.name === 'Tooltip') {
      const titleAttr = (parent.openingElement.attributes || []).find(function (a) {
        return a.type === 'JSXAttribute' && a.name && a.name.name === 'title' &&
          a.value && (a.value.type === 'StringLiteral' || a.value.type === 'Literal') &&
          typeof a.value.value === 'string' && a.value.value.trim().length > 0;
      });
      if (titleAttr) label = titleAttr.value.value.trim();
    }
    if (!label) label = humanize(iconChild.openingElement.name.name);
    const attrText = 'aria-label="' + label + '"';

    if (open.loc.start.line !== open.loc.end.line && attrs.length > 0) {
      // Multi-line opening tag: insert as its own line after the last attribute,
      // copying that attribute's indentation.
      const lastAttr = attrs[attrs.length - 1];
      const lineStart = file.source.lastIndexOf('\n', lastAttr.start) + 1;
      const indent = file.source.slice(lineStart).match(/^[ \t]*/)[0];
      insertions.push({ offset: lastAttr.end, text: '\n' + indent + attrText });
    } else {
      // Single-line tag (or no attributes): insert inline before the closing '>'.
      const closeOffset = file.source.lastIndexOf('>', open.end - 1);
      insertions.push({ offset: closeOffset, text: ' ' + attrText });
    }
  });

  if (insertions.length === 0) {
    return null; // no changes — jscodeshift leaves the file untouched
  }

  // Splice from the end so earlier offsets stay valid.
  let out = file.source;
  insertions.sort(function (a, b) { return b.offset - a.offset; });
  insertions.forEach(function (ins) {
    out = out.slice(0, ins.offset) + ins.text + out.slice(ins.offset);
  });
  return out;
};
