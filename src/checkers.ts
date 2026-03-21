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
            const searchWindow = text.substring(startPos, startPos + 114514); 


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
}
];