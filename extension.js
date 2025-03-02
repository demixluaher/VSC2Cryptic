const vscode = require('vscode');
const http = require('http');

function activate(context) {
    const executeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    executeStatusBarItem.command = "vsc2cryptic.execute";
    executeStatusBarItem.text = "$(play) Execute as Cryptic";
    executeStatusBarItem.show();

    context.subscriptions.push(vscode.commands.registerCommand("vsc2cryptic.execute", () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found!");
            return;
        }

        const scriptContent = editor.document.getText();
        const postData = JSON.stringify({ script: scriptContent });

        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 1337,
                path: '/devbuild/scheduled',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                },
                timeout: 5000
            }, (Response) => {
                let responseBody = '';

                Response.on('data', (chunk) => {
                    responseBody += chunk;
                });

                Response.on('end', () => {
                    if (Response.statusCode >= 200 && Response.statusCode < 300) {
                        vscode.window.showInformationMessage("Executed successfully!");
                    } else {
                        reject(new Error(`HTTP Error: ${Response.statusCode}`));
                    }
                });
            });

            req.on('error', (error) => {
                vscode.window.showErrorMessage(`Request error: ${error.message}`);
                console.log(error.message);
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                vscode.window.showErrorMessage("Request timed out");
                reject(new Error('Request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }));

    if (!context.globalState.get("CheckIfOpened", false)) {
        vscode.window.showInformationMessage("VSC2Cryptic loaded!");
        context.globalState.update("CheckIfOpened", true);
    }

    context.subscriptions.push(executeStatusBarItem);
}

function deactivate() {};

module.exports = {
    activate,
    deactivate
};