import * as vscode from 'vscode';
import { simpleRules, globalRules } from './checkers';
//待实际引入...占个坑先
import { filterIgnoredDiagnostics, shouldIgnore } from './ignore';
import { OiIgnoreFixer } from './fixer';
export function activate(context: vscode.ExtensionContext) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('oi-checker');
    const updateDiagnostics = (document: vscode.TextDocument) => {
        if (document.languageId !== 'cpp' && document.languageId !== 'c') return;

        const text = document.getText();
        const allDiagnostics: vscode.Diagnostic[] = [];

        // 不需要扫描全部代码的规则（局部规则）
		// 目前的逻辑只能实现警告到 问题所在行与与之最近的大括号之间
        simpleRules.forEach(rule => {
            rule.regex.lastIndex = 0; // 重置正则位置，勿动
            let m;
            while ((m = rule.regex.exec(text)) !== null) {
                const braceIndex = m[0].indexOf('{');
                const rangeLen = (braceIndex !== -1) ? braceIndex : m[0].length;//core

                allDiagnostics.push(new vscode.Diagnostic(
                    new vscode.Range(
                        document.positionAt(m.index),
                        document.positionAt(m.index + rangeLen)
                    ),
                    rule.message,
                    rule.severity
                ));
            }
        });

        // 需要遍历所有代码的规则（全局规则）
        globalRules.forEach(rule => {
            allDiagnostics.push(...rule.check(text, document));
        });

        diagnosticCollection.set(document.uri, allDiagnostics);
    };

    // 订阅事件
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
        vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document)),
        vscode.workspace.onDidSaveTextDocument(updateDiagnostics),
        diagnosticCollection
    );

    // 启动检查
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document);
    }
}

export function deactivate() {}