// Diagnóstico de Sintaxe JS
var fso = new ActiveXObject("Scripting.FileSystemObject");
var jsDir = "c:\\Users\\luiss\\.gemini\\antigravity\\playground\\giant-universe\\js\\";
var files = ["notifications.js", "inventory.js", "finance.js", "customers.js", "app.js", "sales.js", "reports.js", "nfe-scanner.js", "payments.js"];

for (var i = 0; i < files.length; i++) {
    var path = jsDir + files[i];
    try {
        if (fso.FileExists(path)) {
            var f = fso.OpenTextFile(path, 1);
            var content = f.ReadAll();
            f.Close();
            // Tenta apenas fazer parse via Function constructor
            try {
                new Function(content);
                WScript.Echo("OK: " + files[i]);
            } catch (e) {
                WScript.Echo("ERRO: " + files[i] + " -> " + e.message);
            }
        } else {
            WScript.Echo("NAO ENCONTRADO: " + files[i]);
        }
    } catch (e2) {
        WScript.Echo("FALHA: " + files[i] + " -> " + e2.message);
    }
}
