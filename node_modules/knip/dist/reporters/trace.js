import st from '../util/colors.js';
import { toRelative } from '../util/path.js';
import { toRegexOrString } from '../util/regex.js';
import { Table } from '../util/table.js';
import { formatTrace } from '../util/trace.js';
export default ({ graph, explorer, options, workspaceFilePathFilter }) => {
    if (options.traceDependency) {
        const pattern = toRegexOrString(options.traceDependency);
        const toRel = (path) => toRelative(path, options.cwd);
        const table = new Table({ truncate: { filePath: 'start' } });
        const seen = new Set();
        for (const [packageName, { imports }] of explorer.getDependencyUsage(pattern)) {
            const filtered = imports.filter(i => workspaceFilePathFilter(i.filePath));
            filtered.sort((a, b) => a.filePath.localeCompare(b.filePath) || (a.line ?? 0) - (b.line ?? 0));
            for (const _import of filtered) {
                const pos = _import.line ? `:${_import.line}:${_import.col}` : '';
                const key = `${_import.filePath}${pos}:${packageName}`;
                if (seen.has(key))
                    continue;
                seen.add(key);
                table.row();
                table.cell('filePath', st.whiteBright(`${toRel(_import.filePath)}${pos}`));
                table.cell('package', st.cyanBright(packageName));
            }
        }
        for (const line of table.toRows())
            console.log(line);
    }
    else {
        let nodes = explorer.buildExportsTree({ filePath: options.traceFile, identifier: options.traceExport });
        if (nodes.length === 0 && options.traceExport?.includes('.')) {
            const nsName = options.traceExport.substring(0, options.traceExport.indexOf('.'));
            nodes = explorer.buildExportsTree({ filePath: options.traceFile, identifier: nsName });
        }
        nodes.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.identifier.localeCompare(b.identifier));
        const toRel = (path) => toRelative(path, options.cwd);
        const isReferenced = (node) => {
            if (explorer.isReferenced(node.filePath, node.identifier, { traverseEntries: false })[0])
                return true;
            if (explorer.hasStrictlyNsReferences(node.filePath, node.identifier)[0])
                return true;
            return !!graph.get(node.filePath)?.exports.get(node.identifier)?.hasRefsInFile;
        };
        for (const node of nodes) {
            const exp = graph.get(node.filePath)?.exports.get(node.identifier);
            let memberStatuses;
            if (exp && exp.members.length > 0) {
                memberStatuses = [];
                for (const m of exp.members) {
                    const id = `${node.identifier}.${m.identifier}`;
                    const referenced = m.hasRefsInFile ||
                        explorer.isReferenced(node.filePath, id, {
                            traverseEntries: true,
                            treatStarAtEntryAsReferenced: true,
                        })[0];
                    memberStatuses.push({ identifier: m.identifier, referenced });
                }
            }
            console.log(formatTrace(node, toRel, isReferenced(node), memberStatuses));
        }
    }
};
