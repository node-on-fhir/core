// scripts/eslint-rules/icon-button-aria-label.js
// Custom rule for the a11y lint pass (.eslintrc.a11y.cjs, loaded via --rulesdir).
//
// Why not jsx-a11y/control-has-associated-label? That rule passes any element
// with JSX-element children (it cannot prove <DeleteIcon/> renders no text), so
// an unlabeled icon-only <IconButton> sails through — verified with a fixture.
// This rule encodes the actual A-4 finding: an IconButton whose children are
// only elements (icons) and that has no aria-label/aria-labelledby needs a name.
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Icon-only MUI IconButton must have aria-label or aria-labelledby (WCAG 4.1.2, 1.1.1)'
    },
    schema: []
  },
  create: function (context) {
    return {
      JSXElement: function (node) {
        const open = node.openingElement;
        if (open.name.type !== 'JSXIdentifier' || open.name.name !== 'IconButton') {
          return;
        }

        const labeled = (open.attributes || []).some(function (a) {
          // A spread ({...props}) may carry a label — don't flag, same as the codemod.
          if (a.type === 'JSXSpreadAttribute') return true;
          return a.type === 'JSXAttribute' &&
            ['aria-label', 'aria-labelledby'].indexOf(a.name && a.name.name) !== -1;
        });
        if (labeled) return;

        // Text or expression children ({label}) may provide an accessible name.
        const hasTextishChild = (node.children || []).some(function (c) {
          return (c.type === 'JSXText' && c.value.trim().length > 0) ||
            c.type === 'JSXExpressionContainer';
        });
        if (hasTextishChild) return;

        context.report({
          node: open,
          message: 'Icon-only IconButton needs aria-label or aria-labelledby (WCAG 4.1.2).'
        });
      }
    };
  }
};
