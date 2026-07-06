// workflows/rspack.workflowParser.js
// Rspack plugin that generates workflow barrel files at build time
//
// This plugin reads workflows/workflows.json and generates:
// - imports/workflows/index.js - Static barrel with workflow imports
// - imports/workflows/loader.js - Helper to register workflows with WorkflowRegistry
// - imports/workflows/server-loader.js - Server-side method imports
//
// Usage:
//   const WorkflowParserPlugin = require('./workflows/rspack.workflowParser.js');
//   const plugin = new WorkflowParserPlugin({ manifestPath: '...', outputDir: '...' });
//   plugin.generate();

const fs = require('fs');
const path = require('path');

class WorkflowParserPlugin {
  constructor(options = {}) {
    this.manifestPath = options.manifestPath || path.resolve(__dirname, 'workflows.json');
    this.outputDir = options.outputDir || path.resolve(__dirname, '../imports/workflows');
  }

  /**
   * Generate barrel files - call this before rspack bundling starts
   */
  generate() {
    // Read the manifest
    let manifest = { workflows: [] };
    try {
      const manifestContent = fs.readFileSync(this.manifestPath, 'utf8');
      manifest = JSON.parse(manifestContent);
      console.log('[WorkflowParser] Found', manifest.workflows?.length || 0, 'workflow(s) in manifest');
    } catch (e) {
      console.log('[WorkflowParser] No manifest found at', this.manifestPath);
      console.log('[WorkflowParser] Generating empty barrel file');
    }

    // Filter enabled workflows, verifying each is actually installed
    const enabledWorkflows = (manifest.workflows || []).filter(function(w) {
      if (w.enabled === false) return false;
      try {
        require.resolve(w.package);
        return true;
      } catch (e) {
        console.warn('[WorkflowParser] Manifest workflow not installed, skipping:', w.package);
        return false;
      }
    });
    console.log('[WorkflowParser] Enabled workflows:', enabledWorkflows.length);

    // Check EXTRA_WORKFLOWS environment variable
    const extraWorkflows = process.env.EXTRA_WORKFLOWS ? process.env.EXTRA_WORKFLOWS.split(',') : [];
    extraWorkflows.forEach(pkg => {
      const pkgName = pkg.trim();
      if (pkgName && !enabledWorkflows.find(w => w.package === pkgName)) {
        // Verify the package is actually installed before adding it
        try {
          require.resolve(pkgName);
        } catch (e) {
          console.warn('[WorkflowParser] EXTRA_WORKFLOWS package not installed, skipping:', pkgName);
          return;
        }

        // Check if package exists in manifest (for serverEntry) even if disabled
        const manifestEntry = (manifest.workflows || []).find(w => w.package === pkgName);
        enabledWorkflows.push({
          package: pkgName,
          entry: manifestEntry?.entry || './client.js',
          serverEntry: manifestEntry?.serverEntry || './server/methods',
          hooksEntry: manifestEntry?.hooksEntry || null,
          enabled: true,
          settings: manifestEntry?.settings || {}
        });
        console.log('[WorkflowParser] Added from EXTRA_WORKFLOWS:', pkgName);
      }
    });

    // Validate manifest + each package's workflow.json before bundling.
    // Throws on hard errors (missing required fields, malformed JSON) so a bad
    // string contract fails the build instead of rendering null at runtime.
    this.validateWorkflows(enabledWorkflows);

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Generate index.js (static barrel for client)
    this.generateBarrel(enabledWorkflows);

    // Generate loader.js (client-side loader helper)
    this.generateLoader(enabledWorkflows);

    // Generate server-loader.js (server-side method imports)
    this.generateServerLoader(enabledWorkflows);

    // Copy assets/ directories from enabled workflows into public/workflows/
    this.copyWorkflowAssets(enabledWorkflows);

    console.log('[WorkflowParser] Generated barrel files in', this.outputDir);
  }

  /**
   * Rspack plugin apply method - for use as an rspack plugin
   */
  apply(compiler) {
    // Run generation at the start of compilation
    compiler.hooks.beforeCompile.tap('WorkflowParserPlugin', () => {
      this.generate();
    });
  }

  /**
   * Validate the enabled workflows' manifest entries and per-package
   * workflow.json files. Honeycomb's plugin wiring rides on string contracts
   * (route component names, MUI iconNames, serverEntry paths) verified by
   * nothing — a typo renders null or skips publications silently
   * (FABLE-TECH-DEBT-PAYDOWN.md § P2). This makes those failures loud:
   *   - THROW on hard errors: missing "package", malformed workflow.json,
   *     routes/sidebarItems missing required string fields, bad path format.
   *   - WARN on soft issues: serverEntry defaulting to ./server/methods (the
   *     publications/cron gotcha), lowercase/unknown MUI iconName, and a route
   *     component not referenced in client.js (renders null).
   */
  validateWorkflows(workflows) {
    if (!workflows || workflows.length === 0) return;

    const errors = [];
    const warnings = [];
    const seen = new Set();

    workflows.forEach((wf) => {
      const pkg = wf.package;

      if (!pkg || typeof pkg !== 'string') {
        errors.push('Manifest entry missing a string "package" field: ' + JSON.stringify(wf));
        return;
      }
      if (seen.has(pkg)) {
        warnings.push('Duplicate manifest entry for "' + pkg + '" — only the first is used.');
      }
      seen.add(pkg);

      // The serverEntry gotcha: defaulting to ./server/methods silently skips
      // publications, cron, and collection initialization.
      if (!wf.serverEntry) {
        warnings.push(pkg + ': no "serverEntry" in manifest — defaults to "./server/methods", '
          + 'which skips publications, cron, and collection init. Set "serverEntry": "./server".');
      }

      // Locate the installed package to read workflow.json + client.js
      let packageDir = null;
      try {
        packageDir = path.dirname(require.resolve(pkg));
      } catch (e) {
        return; // generate() already warned about uninstalled packages
      }

      const wfJsonPath = path.join(packageDir, 'workflow.json');
      if (!fs.existsSync(wfJsonPath)) return; // workflow.json is optional

      let wfJson;
      try {
        wfJson = JSON.parse(fs.readFileSync(wfJsonPath, 'utf8'));
      } catch (e) {
        errors.push(pkg + ': workflow.json is not valid JSON — ' + e.message);
        return;
      }

      // Read client.js once for the component-mapping completeness heuristic
      let clientSrc = '';
      try {
        const clientPath = path.join(packageDir, (wf.entry || './client.js').replace('./', ''));
        clientSrc = fs.readFileSync(clientPath, 'utf8');
      } catch (e) { /* client entry optional for validation */ }

      // routes
      if (wfJson.routes !== undefined) {
        if (!Array.isArray(wfJson.routes)) {
          errors.push(pkg + ': workflow.json "routes" must be an array.');
        } else {
          wfJson.routes.forEach((r, i) => {
            const where = pkg + ' route[' + i + ']';
            if (!r || typeof r !== 'object') { errors.push(where + ' must be an object.'); return; }
            ['name', 'path', 'component'].forEach((field) => {
              if (!r[field] || typeof r[field] !== 'string') {
                errors.push(where + ' missing required string "' + field + '".');
              }
            });
            if (typeof r.path === 'string' && r.path[0] !== '/') {
              errors.push(where + ' path "' + r.path + '" must start with "/".');
            }
            if (clientSrc && typeof r.component === 'string' && clientSrc.indexOf(r.component) === -1) {
              warnings.push(where + ' component "' + r.component + '" is not referenced in client.js — '
                + 'it will render null. Add a mapping case.');
            }
          });
        }
      }

      // sidebarItems
      if (wfJson.sidebarItems !== undefined) {
        if (!Array.isArray(wfJson.sidebarItems)) {
          errors.push(pkg + ': workflow.json "sidebarItems" must be an array.');
        } else {
          wfJson.sidebarItems.forEach((s, i) => {
            const where = pkg + ' sidebarItem[' + i + ']';
            if (!s || typeof s !== 'object') { errors.push(where + ' must be an object.'); return; }
            ['primaryText', 'to', 'iconName'].forEach((field) => {
              if (!s[field] || typeof s[field] !== 'string') {
                errors.push(where + ' missing required string "' + field + '".');
              }
            });
            if (typeof s.iconName === 'string' && s.iconName) {
              if (s.iconName[0] !== s.iconName[0].toUpperCase()) {
                warnings.push(where + ' iconName "' + s.iconName + '" is lowercase — MUI icon names are '
                  + 'PascalCase (try "' + s.iconName[0].toUpperCase() + s.iconName.slice(1) + '").');
              } else if (!this._muiIconExists(s.iconName)) {
                warnings.push(where + ' iconName "' + s.iconName + '" not found in @mui/icons-material — '
                  + 'the sidebar item will have no icon.');
              }
            }
          });
        }
      }
    });

    warnings.forEach((w) => console.warn('[WorkflowParser] WARN ' + w));

    if (errors.length > 0) {
      throw new Error('[WorkflowParser] workflow.json validation failed:\n  - ' + errors.join('\n  - '));
    }
    if (warnings.length === 0) {
      console.log('[WorkflowParser] Validated ' + workflows.length + ' workflow(s): OK');
    }
  }

  /** Does @mui/icons-material export an icon by this exact (PascalCase) name? */
  _muiIconExists(name) {
    if (this._muiIconsDir === undefined) {
      try {
        this._muiIconsDir = path.dirname(require.resolve('@mui/icons-material/Map.js'));
      } catch (e) {
        this._muiIconsDir = null; // icons pkg not resolvable — don't false-warn
      }
    }
    if (!this._muiIconsDir) return true;
    return fs.existsSync(path.join(this._muiIconsDir, name + '.js'));
  }

  generateBarrel(workflows) {
    const lines = [
      '// AUTO-GENERATED by rspack.workflowParser.js',
      '// DO NOT EDIT - changes will be overwritten on next build',
      '// Generated at: ' + new Date().toISOString(),
      ''
    ];

    if (workflows.length === 0) {
      // Empty barrel for CI builds
      lines.push('// No workflows enabled');
      lines.push('export const workflowModules = [];');
      lines.push('');
      lines.push('export default workflowModules;');
    } else {
      // Generate import statements
      workflows.forEach((workflow, index) => {
        const varName = `_workflow${index}`;
        const entry = workflow.entry || './client.js';
        // Use the package name with optional entry point
        const importPath = entry === './client.js' ? workflow.package : `${workflow.package}/${entry.replace('./', '')}`;
        lines.push(`import * as ${varName} from '${importPath}';`);
      });

      lines.push('');

      // Generate exports
      lines.push('export const workflowModules = [');
      workflows.forEach((workflow, index) => {
        const varName = `_workflow${index}`;
        const settings = JSON.stringify(workflow.settings || {});
        lines.push(`  { name: '${workflow.package}', module: ${varName}, settings: ${settings} },`);
      });
      lines.push('];');

      lines.push('');
      lines.push('export default workflowModules;');
    }

    const content = lines.join('\n');
    const outputPath = path.join(this.outputDir, 'index.js');
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log('[WorkflowParser] Generated', outputPath);
  }

  generateLoader(workflows) {
    const lines = [
      '// AUTO-GENERATED by rspack.workflowParser.js',
      '// DO NOT EDIT - changes will be overwritten on next build',
      '// Dynamic loader helper for workflows',
      '',
      "import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';",
      "import { workflowModules } from './index.js';",
      '',
      '/**',
      ' * Register all workflow modules with the WorkflowRegistry',
      ' * Call this during app initialization',
      ' */',
      '// Mirror the server-loader: register each workflow module into the global',
      '// `Package` registry on the CLIENT too, so client-side consumers can detect',
      '// a migrated npm package the same way they detected the Atmosphere one',
      "// (e.g. `if (Package['@node-on-fhir/pacio-core'])`). Atmosphere exposed",
      '// `Package` on both client and server; this keeps the npm registry symmetric.',
      '// See .claude/rules/fhir/package-registry.md.',
      'globalThis.Package = globalThis.Package || {};',
      'workflowModules.forEach(({ name, module }) => {',
      '  globalThis.Package[name] = module.default || module;',
      '});',
      '',
      'export function registerWorkflows() {',
      '  workflowModules.forEach(({ name, module, settings }) => {',
      '    const workflow = module.default || module;',
      '    WorkflowRegistry.registerWorkflow(workflow);',
      '    console.log(`[WorkflowLoader] Registered workflow: ${name}`);',
      '  });',
      '',
      '  console.log(`[WorkflowLoader] Registered ${workflowModules.length} workflow(s)`);',
      '}',
      '',
      'export default registerWorkflows;'
    ];

    const content = lines.join('\n');
    const outputPath = path.join(this.outputDir, 'loader.js');
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log('[WorkflowParser] Generated', outputPath);
  }

  /**
   * Resolve a workflow subpath entry (serverEntry/hooksEntry) against the
   * package's exports map. Returns true when `<pkg>/<entry>` is importable.
   * Guards the generated loaders: an unverified subpath becomes an
   * __rspack_missing_module stub that CRASHES the server at boot (the
   * @orbital/timelines gotcha) — one bad extension must never take down
   * the app.
   */
  entryResolves(pkg, entry) {
    if (!entry) return false;
    const exportPath = entry.replace('./', '').replace(/\.js$/, '');
    try {
      require.resolve(`${pkg}/${exportPath}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  generateServerLoader(workflows) {
    const lines = [
      '// AUTO-GENERATED by rspack.workflowParser.js',
      '// DO NOT EDIT - changes will be overwritten on next build',
      '// Server-side workflow method imports',
      ''
    ];

    // Resolve-gate every server entry before emitting its import.
    // Manifest-declared entries that don't resolve warn-and-skip; the
    // ./server/methods default additionally falls back to ./server.
    const serverWorkflows = [];
    workflows.forEach((workflow) => {
      const declared = workflow.serverEntry;
      const isDefault = !declared || declared === './server/methods';
      let entry = null;

      if (this.entryResolves(workflow.package, declared || './server/methods')) {
        entry = declared || './server/methods';
      } else if (isDefault && this.entryResolves(workflow.package, './server')) {
        entry = './server';
        console.warn('[WorkflowParser]', workflow.package,
          ': default serverEntry ./server/methods does not resolve — using ./server instead.',
          'Declare "serverEntry" in workflows/workflows.json to silence this.');
      }

      if (entry) {
        serverWorkflows.push(Object.assign({}, workflow, { resolvedServerEntry: entry }));
      } else {
        console.warn('[WorkflowParser] WARN:', workflow.package,
          ': no resolvable server entry (tried',
          (declared || './server/methods') + (isDefault ? ', ./server' : ''),
          ') — server-side code for this package is SKIPPED.',
          'Add the subpath to the package "exports" map or declare a valid "serverEntry".');
      }
    });

    // Filter workflows that have hooks — same resolve gate
    const workflowsWithHooks = workflows.filter((w) => {
      if (!w.hooksEntry) return false;
      if (this.entryResolves(w.package, w.hooksEntry)) return true;
      console.warn('[WorkflowParser] WARN:', w.package,
        ': hooksEntry', w.hooksEntry,
        'does not resolve — hooks for this package are SKIPPED.',
        'Add the subpath to the package "exports" map (the hooksEntry/exports gotcha).');
      return false;
    });

    if (workflows.length === 0) {
      lines.push('// No workflows enabled');
      lines.push('export function registerServerMethods() {');
      lines.push("  console.log('[WorkflowLoader] No server methods to register');");
      lines.push('}');
    } else {
      // Namespace-import each workflow's server entry and register it into the
      // global `Package` object. This evaluates the module (running its method/
      // publication side effects) AND exposes its named exports under
      // `Package['<pkg>']`, so the server-side discovery loops that iterate the
      // Atmosphere `Package` registry — e.g. ProfileSet (server/Metadata.js) and
      // ProfileDecorators (server/RestHelpers.js) — find npm workflow packages
      // exactly like Atmosphere packages, with no per-package boilerplate.
      // Packages whose server entry re-exports nothing register as `{}` (harmless).
      // See .claude/rules/fhir/package-registry.md.
      // Use package exports format (no .js extension) per package.json "exports" field
      serverWorkflows.forEach((workflow, index) => {
        // Remove ./ prefix and .js extension to match package exports format
        const exportPath = workflow.resolvedServerEntry.replace('./', '').replace(/\.js$/, '');
        const importPath = `${workflow.package}/${exportPath}`;
        lines.push(`import * as _serverModule${index} from '${importPath}';`);
      });

      lines.push('');
      lines.push('// Register npm workflow server exports into the global Package registry');
      lines.push('// (the npm-workflow equivalent of Atmosphere api.export discovery).');
      lines.push('globalThis.Package = globalThis.Package || {};');
      serverWorkflows.forEach((workflow, index) => {
        lines.push(`globalThis.Package['${workflow.package}'] = _serverModule${index};`);
      });

      lines.push('');
      lines.push('export function registerServerMethods() {');
      lines.push(`  console.log('[WorkflowLoader] Server methods registered for ${serverWorkflows.length} workflow(s)');`);
      lines.push('}');
    }

    // Generate hook imports and initializeWorkflowHooks()
    lines.push('');

    if (workflowsWithHooks.length === 0) {
      lines.push('// No workflow hooks configured');
      lines.push('export function initializeWorkflowHooks() {');
      lines.push("  console.log('[WorkflowLoader] No workflow hooks to initialize');");
      lines.push('}');
    } else {
      // Import hook modules (namespace import to find init* export dynamically)
      workflowsWithHooks.forEach((workflow, index) => {
        const hooksEntry = workflow.hooksEntry;
        const exportPath = hooksEntry.replace('./', '').replace('.js', '');
        const importPath = `${workflow.package}/${exportPath}`;
        const varName = `_hooksModule${index}`;
        lines.push(`import * as ${varName} from '${importPath}';`);
      });

      lines.push('');
      lines.push('// Find first init*Hooks export from a module namespace');
      lines.push('function _findInitFn(mod) {');
      lines.push('  var keys = Object.keys(mod);');
      lines.push('  for (var i = 0; i < keys.length; i++) {');
      lines.push("    if (keys[i].indexOf('init') === 0 && typeof mod[keys[i]] === 'function') {");
      lines.push('      return mod[keys[i]];');
      lines.push('    }');
      lines.push('  }');
      lines.push("  return typeof mod.default === 'function' ? mod.default : null;");
      lines.push('}');
      lines.push('');
      lines.push('export function initializeWorkflowHooks() {');
      lines.push('  const hooks = [');

      workflowsWithHooks.forEach((workflow, index) => {
        const shortName = workflow.package.split('/').pop();
        const varName = `_hooksModule${index}`;
        lines.push(`    { name: '${shortName}', init: _findInitFn(${varName}) },`);
      });

      lines.push('  ];');
      lines.push('');
      lines.push('  hooks.forEach(function(h) {');
      lines.push('    try {');
      lines.push('      if (typeof h.init !== \'function\') {');
      lines.push("        console.warn('[WorkflowLoader] No init function found for hooks: ' + h.name);");
      lines.push('        return;');
      lines.push('      }');
      lines.push('      h.init();');
      lines.push("      console.log('[WorkflowLoader] Initialized hooks: ' + h.name);");
      lines.push('    } catch (e) {');
      lines.push("      console.error('[WorkflowLoader] Failed to initialize hooks for ' + h.name + ':', e);");
      lines.push('    }');
      lines.push('  });');
      lines.push('');
      lines.push(`  console.log('[WorkflowLoader] Initialized hooks for ' + hooks.length + ' workflow(s)');`);
      lines.push('}');
    }

    lines.push('');
    lines.push('export default registerServerMethods;');

    const content = lines.join('\n');
    const outputPath = path.join(this.outputDir, 'server-loader.js');
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log('[WorkflowParser] Generated', outputPath);
  }

  copyWorkflowAssets(workflows) {
    const publicWorkflowsDir = path.resolve(__dirname, '../public/workflows');

    // Clean public/workflows/ on each run to remove stale assets from disabled
    // packages. This is best-effort: `meteor deploy` runs the client and server
    // builds as separate processes that both execute this plugin and race on the
    // shared dir, so rmSync can throw ENOTEMPTY/ENOENT mid-removal even with
    // force:true (the other process is writing into it). Tolerate that race — the
    // per-package copy below is idempotent, so public/workflows/ converges to the
    // correct contents regardless of which process wins. Re-throw anything else.
    if (fs.existsSync(publicWorkflowsDir)) {
      try {
        fs.rmSync(publicWorkflowsDir, { recursive: true, force: true });
      } catch (err) {
        if (err.code !== 'ENOTEMPTY' && err.code !== 'ENOENT') {
          throw err;
        }
        console.warn('[WorkflowParser] public/workflows clean skipped (concurrent build race):', err.code);
      }
    }

    if (workflows.length === 0) {
      return;
    }

    let totalCopied = 0;

    workflows.forEach(function(workflow) {
      try {
        // Resolve the package's filesystem path
        const packageMain = require.resolve(workflow.package);
        const packageDir = path.dirname(packageMain);
        const assetsDir = path.join(packageDir, 'assets');

        if (!fs.existsSync(assetsDir) || !fs.statSync(assetsDir).isDirectory()) {
          return;
        }

        // Derive short name from scoped package (e.g. @node-on-fhir/radiology-workflow -> radiology-workflow)
        const shortName = workflow.package.split('/').pop();
        const destDir = path.join(publicWorkflowsDir, shortName);

        fs.mkdirSync(destDir, { recursive: true });

        // Copy all non-hidden files
        const files = fs.readdirSync(assetsDir);
        let filesCopied = 0;

        files.forEach(function(file) {
          // Skip hidden files and macOS resource forks
          if (file.startsWith('.') || file.startsWith('._')) {
            return;
          }

          const srcPath = path.join(assetsDir, file);
          const destPath = path.join(destDir, file);

          // Only copy files, not subdirectories
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
            filesCopied++;
          }
        });

        if (filesCopied > 0) {
          console.log('[WorkflowParser] Copied ' + shortName + ' assets to public/workflows/' + shortName + '/ (' + filesCopied + ' file(s))');
          totalCopied += filesCopied;
        }
      } catch (e) {
        // Package not found or not installed - skip silently
        console.warn('[WorkflowParser] Could not resolve assets for', workflow.package, '-', e.message);
      }
    });

    if (totalCopied > 0) {
      console.log('[WorkflowParser] Total workflow assets copied:', totalCopied);
    }
  }
}

module.exports = WorkflowParserPlugin;
