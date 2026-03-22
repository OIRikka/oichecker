import * as vscode from 'vscode';
//接口信息
export interface SimpleRule {
    regex: RegExp;
    message: string;
    severity: vscode.DiagnosticSeverity;
}

export interface GlobalRule {
    name: string;
    check: (text: string, document: vscode.TextDocument) => vscode.Diagnostic[];
}
//局部规则
//打算自己写的 freopen判断 数组下标 sort是否+1
export const simpleRules: SimpleRule[] = [
    {

        regex: /(if|while)\s*\(\s*[^=!><\s]+\s*=\s*[^=!\s]+\s*\)/g,
        message: "if/while 中疑似误用 '=' 而非 '=='",
        severity: vscode.DiagnosticSeverity.Warning
    }
];
//复杂规则
//逻辑有问题 求大佬修改 功能是检测多测数据是否清空 问题是里面有for循环清空
//感觉这些全文扫描不太实用 按需开启即可
export const globalRules: GlobalRule[] = [

    {
        name: "MultiTestClearChecker",
        check: (text, document) => {
            const diagnostics: vscode.Diagnostic[] = [];
            const loopRegex = /while\s*\(\s*(.*?(?:\b\w+\b\s*--|--\s*\b\w+\b|cin\s*>>|scanf|~|!=|EOF).*?)\s*\)\s*\{/g;

            let match;
            while ((match = loopRegex.exec(text)) !== null) {

                const startPos = match.index + match[0].length;
                const searchWindow = text.substring(startPos, startPos + 90005);


                const hasClear = /memset|fill|std::fill|\.clear\(\)|for.*?=\s*0/.test(searchWindow);

                if (!hasClear && searchWindow.trim().length > 1) {
                    const headerEnd = match[0].indexOf('{');
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(
                            document.positionAt(match.index),
                            document.positionAt(match.index + (headerEnd !== -1 ? headerEnd : match[0].length))
                        ),
                        "多组数据疑似未清空",
                        vscode.DiagnosticSeverity.Warning
                    ));
                }
            }
            return diagnostics;
        }
    },

    {
        name: "FreopenChecker",
        check: (text, document) => {
            const diagnostics: vscode.Diagnostic[] = [];
            const looseFreopenRegex = /(\s*(?:\/\/|\/\*)\s*)?freopen\s*\(([\s\S]*?)\)\s*;?/gm;

            let match;
            const activeFiles: { name: string, ext: string, range: vscode.Range }[] = [];

            while ((match = looseFreopenRegex.exec(text)) !== null) {
                const fullLine = match[0];
                const isCommented = match[1] !== undefined;
                const content = match[2];
                const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + fullLine.length));

                if (content.includes("'")) {
                    diagnostics.push(new vscode.Diagnostic(range, "请使用双引号 \" \" 而非单引号 ' '", vscode.DiagnosticSeverity.Error));
                }

                const args = content.split(',').map(arg => arg.trim().replace(/"/g, ''));
                if (args.length === 3) {
                    const [fileName, mode, stream] = args;

                    if (!isCommented) {
                        const fileMatch = fileName.match(/^([^.]+)\.(in|out)$/);
                        if (fileMatch) {
                            activeFiles.push({ name: fileMatch[1], ext: fileMatch[2], range });
                        }
                    }

                    if (fileName.endsWith('.in') && (stream.includes('stdout') || mode.includes('w'))) {
                        diagnostics.push(new vscode.Diagnostic(range, "读取 .in 文件却指向了 stdout 或使用了 'w' 模式", vscode.DiagnosticSeverity.Error));
                    }
                    if (fileName.endsWith('.out') && (stream.includes('stdin') || mode.includes('r'))) {
                        diagnostics.push(new vscode.Diagnostic(range, "写入 .out 文件却指向了 stdin 或使用了 'r' 模式", vscode.DiagnosticSeverity.Error));
                    }
                    if (/,in|,out/.test(content)) {
                        diagnostics.push(new vscode.Diagnostic(range, "后缀名前应为点号 '.' 而非逗号 ','", vscode.DiagnosticSeverity.Error));
                    }
                } else if (!isCommented && content.trim().length > 0) {
                    diagnostics.push(new vscode.Diagnostic(range, "freopen 必须包含 3 个参数", vscode.DiagnosticSeverity.Error));
                }

                if (isCommented && diagnostics.filter(d => d.range.isEqual(range)).length === 0) {
                    diagnostics.push(new vscode.Diagnostic(range, "freopen 已被注释，提交前记得开启", vscode.DiagnosticSeverity.Information));
                }
            }

            if (activeFiles.length > 0) {
                const ins = activeFiles.filter(f => f.ext === 'in');
                const outs = activeFiles.filter(f => f.ext === 'out');

                if (ins.length !== outs.length) {
                    activeFiles.forEach(f => {
                        diagnostics.push(new vscode.Diagnostic(f.range, "freopen 未成对出现 ", vscode.DiagnosticSeverity.Warning));
                    });
                }

                else if (ins.length > 0 && outs.length > 0) {

                    if (ins[0].name !== outs[0].name) {
                        const errorMsg = `文件名不匹配：输入为 "${ins[0].name}"，输出为 "${outs[0].name}"`;
                        diagnostics.push(new vscode.Diagnostic(ins[0].range, errorMsg, vscode.DiagnosticSeverity.Error));
                        diagnostics.push(new vscode.Diagnostic(outs[0].range, errorMsg, vscode.DiagnosticSeverity.Error));
                    }
                }
            }

            return diagnostics;
        }
    }
];