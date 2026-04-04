import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';
import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { r } from "https://esm.sh/@codemirror/lang-r";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark";

// 1. Initialize CodeMirror
const editor = new EditorView({
  doc: "# Insert your code here and click Run\n",
  extensions: [basicSetup, r(), oneDark, EditorView.lineWrapping],
  parent: document.getElementById("editor-container")
});

// 2. Initialize webR
const webR = new WebR();
await webR.init();
document.getElementById('status').innerText = "R is Ready";
document.getElementById('run-btn').disabled = false;

const consoleOut = document.getElementById('console-output');
const plotOut = document.getElementById('plot-output');

// 3. Execution Logic
document.getElementById('run-btn').onclick = async () => {
  const code = editor.state.doc.toString();
  const shelter = await webR.shelter();
  
  try {
    await webR.evalRVoid(`canvas(width=500, height=400)`);
    const result = await shelter.evalR(code);
    const output = await result.toJs();
    consoleOut.innerText += `\n> ${output.values}`;
    
    await webR.evalRVoid('dev.off()');
    const msgs = await webR.readEvents();
    msgs.forEach((m) => {
      if (m.type === 'canvas' && m.data.event === 'drawCanvas') {
        const canv = document.createElement('canvas');
        canv.width = 500; canv.height = 400;
        canv.getContext('2d').drawImage(m.data.image, 0, 0);
        plotOut.appendChild(canv);
      }
    });
  } catch (e) { consoleOut.innerText += `\nError: ${e.message}`; }
  finally { shelter.purge(); }
};

// 4. Clear Logic
document.getElementById('clear-btn').onclick = () => {
  editor.dispatch({changes: {from: 0, to: editor.state.doc.length, insert: ""}});
  consoleOut.innerText = "";
  plotOut.innerHTML = "";
};
