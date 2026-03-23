//检查是否忽略警告
//忽略警告：行前加//tp

import * as vscode from 'vscode';

export function shouldIgnore(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): boolean {
    const line = document.lineAt(diagnostic.range.start.line);
    return line.text.includes("//np");//在这里修改用于忽略警告的注释内容
}


export function filterIgnoredDiagnostics(document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]): vscode.Diagnostic[] {
    return diagnostics.filter(diag => !shouldIgnore(document, diag));
}