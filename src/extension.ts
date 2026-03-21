import * as vscode from 'vscode';

// fucker
export function activate(context: vscode.ExtensionContext) {
    // 1. errors
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('oi-checker');

    // 2. checkers
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
    }

    // 3. dynamiccheck
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
            updateDiagnostics(e.document, diagnosticCollection);
        })
    );

    // 4. close
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => diagnosticCollection.delete(doc.uri))
    );
}

// checker
function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    if (document.languageId !== 'cpp') return;

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    //example"a==b instead of a=b"
    const assignRegex = /(if|while)\s*\(\s*[^=!><\s]+\s*=\s*[^=!\s]+\s*\)/g;

    let match;
    while ((match = assignRegex.exec(text)) !== null) {
        const range = new vscode.Range(
            document.positionAt(match.index),
            document.positionAt(match.index + match[0].length)
        );

        const diagnostic = new vscode.Diagnostic(
            range,
            "if语句中疑似误用=而非==",
            vscode.DiagnosticSeverity.Warning 
        );
        diagnostics.push(diagnostic);
    }

    //plugins

    // updates
    collection.set(document.uri, diagnostics);
}

// exits
export function deactivate() {}