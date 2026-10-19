    const alphabets = {
        uk: 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя',
        en: 'abcdefghijklmnopqrstuvwxyz'
    };

    let currentCipher = 'caesar'; // 'caesar' or 'perm'

    function setCipher(type) {
        currentCipher = type;
        document.getElementById('tab-caesar').classList.toggle('active', type === 'caesar');
        document.getElementById('tab-perm').classList.toggle('active', type === 'perm');
        
        const keyLabel = document.getElementById('key-label');
        const keyInput = document.getElementById('cipher-key');
        
        if (type === 'caesar') {
            keyLabel.innerText = 'Зміщення k';
            keyInput.type = 'number';
            keyInput.value = '7';
        } else {
            keyLabel.innerText = 'Ключ (слово)';
            keyInput.type = 'text';
            keyInput.value = 'СЕКРЕТ';
        }
    }

    function onInputTextChange() {
        document.getElementById('in-count').innerText = `${document.getElementById('input-text').value.length} символів`;
        updateHistograms();
    }

    function updateOutCount() {
        document.getElementById('out-count').innerText = `${document.getElementById('output-text').value.length} символів`;
    }

    function clearAll() {
        document.getElementById('input-text').value = '';
        document.getElementById('output-text').value = '';
        document.getElementById('file-status').innerText = 'Файл ще не відкрито';
        document.getElementById('file-input').value = '';
        onInputTextChange();
        updateOutCount();
        updateHistograms();
    }

    function loadSample() {
        document.getElementById('input-text').value = "Криптографія — це наука про математичні методи забезпечення конфіденційності, цілісності і автентичності інформації.";
        onInputTextChange();
    }

    // Processing Logic
    function processText(action) {
        const text = document.getElementById('input-text').value;
        const keyVal = document.getElementById('cipher-key').value;
        const lang = document.getElementById('alphabet-select').value;
        let result = '';

        if (!text) return;

        if (currentCipher === 'caesar') {
            const shift = parseInt(keyVal) || 0;
            result = caesarCipher(text, action === 'encrypt' ? shift : -shift, alphabets[lang]);
        } else {
            result = columnarTransposition(text, keyVal.toUpperCase(), action === 'encrypt');
        }

        document.getElementById('output-text').value = result;
        updateOutCount();
        updateHistograms();
    }

    // Caesar Cipher
    function caesarCipher(text, shift, alphabet) {
        let result = '';
        const len = alphabet.length;
        
        // Handle negative shifts correctly in JS
        shift = ((shift % len) + len) % len;

        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            let isUpper = char === char.toUpperCase();
            let lowerChar = char.toLowerCase();
            let idx = alphabet.indexOf(lowerChar);

            if (idx !== -1) {
                let newIdx = (idx + shift) % len;
                let newChar = alphabet[newIdx];
                result += isUpper ? newChar.toUpperCase() : newChar;
            } else {
                result += char; // Keep symbols and spaces
            }
        }
        return result;
    }

    // Columnar Transposition Cipher (Таблична перестановка)
    function columnarTransposition(text, key, isEncrypt) {
        if (!key) return text;
        
        // Remove spaces for standard classical transposition (optional, but typical for labs)
        let processedText = isEncrypt ? text.replace(/\s+/g, '') : text;
        
        let colCount = key.length;
        let rowCount = Math.ceil(processedText.length / colCount);
        
        // Determine column reading order based on alphabetical order of key characters
        let keyArr = Array.from(key).map((char, index) => ({ char, index }));
        keyArr.sort((a, b) => a.char.localeCompare(b.char));
        
        let result = '';

        if (isEncrypt) {
            let grid = [];
            let k = 0;
            for (let r = 0; r < rowCount; r++) {
                grid[r] = [];
                for (let c = 0; c < colCount; c++) {
                    grid[r][c] = k < processedText.length ? processedText[k++] : ''; 
                }
            }
            for (let item of keyArr) {
                let c = item.index;
                for (let r = 0; r < rowCount; r++) {
                    if (grid[r][c]) result += grid[r][c];
                }
            }
        } else {
            // Decrypt
            let emptyCells = (colCount * rowCount) - processedText.length;
            let colLengths = Array(colCount).fill(rowCount);
            // Subtract lengths from the end columns if grid is not full
            for(let i = 0; i < emptyCells; i++) {
                colLengths[colCount - 1 - i]--;
            }
            
            let grid = Array.from({ length: rowCount }, () => Array(colCount).fill(''));
            let k = 0;
            
            // Fill columns in sorted key order
            for (let item of keyArr) {
                let c = item.index;
                for (let r = 0; r < colLengths[c]; r++) {
                    grid[r][c] = processedText[k++];
                }
            }
            
            // Read rows
            for (let r = 0; r < rowCount; r++) {
                for (let c = 0; c < colCount; c++) {
                    if (grid[r][c]) result += grid[r][c];
                }
            }
        }
        return result;
    }

    // Histograms
    function updateHistograms() {
        const inText = document.getElementById('input-text').value;
        const outText = document.getElementById('output-text').value;
        const lang = document.getElementById('alphabet-select').value;
        const alphabet = alphabets[lang];

        drawChart(inText, alphabet, 'chart-input');
        drawChart(outText, alphabet, 'chart-output');
    }

    function drawChart(text, alphabet, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (!text) return;

        let counts = {};
        let maxCount = 0;
        
        for (let char of text.toLowerCase()) {
            if (alphabet.includes(char)) {
                counts[char] = (counts[char] || 0) + 1;
                if (counts[char] > maxCount) maxCount = counts[char];
            }
        }

        for (let char of alphabet) {
            let count = counts[char] || 0;
            let heightPercent = maxCount === 0 ? 0 : (count / maxCount) * 100;
            
            let barGroup = document.createElement('div');
            barGroup.className = 'bar-group';
            barGroup.title = `${char.toUpperCase()}: ${count}`;
            
            barGroup.innerHTML = `
                <div class="bar" style="height: ${heightPercent}%"></div>
                <div class="bar-label">${char}</div>
            `;
            container.appendChild(barGroup);
        }
    }

    // File Operations
    function openFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('input-text').value = e.target.result;
            document.getElementById('file-status').innerText = `Відкрито: ${file.name}`;
            onInputTextChange();
        };
        reader.readAsText(file);
    }

    function saveFile(type) {
        const textId = type === 'input' ? 'input-text' : 'output-text';
        const text = document.getElementById(textId).value;
        if (!text) {
            alert('Немає тексту для збереження!');
            return;
        }

        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = type === 'input' ? 'source.txt' : 'cipher.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Initialize
    updateHistograms();
