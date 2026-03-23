//用按钮忽略而不是人工注释忽略
import * as vscode from 'vscode';

export class OiIgnoreFixer implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] {
        return context.diagnostics
            .filter(diagnostic => diagnostic.source === 'oi-checker' || true) 
            .map(diagnostic => this.createFix(document, diagnostic));
    }

    private createFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const fix = new vscode.CodeAction(
            `忽略此警告 (添加 //np)`,
            vscode.CodeActionKind.QuickFix
        );
        

        const line = document.lineAt(diagnostic.range.start.line);
        const edit = new vscode.WorkspaceEdit();
        
   
        edit.insert(document.uri, line.range.end, " //np");
        
        fix.edit = edit;
        fix.isPreferred = true;
        return fix;
    }
}