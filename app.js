document.addEventListener('DOMContentLoaded', () => {
  const regexPatternInput = document.getElementById('regexPattern');
  const testTextInput = document.getElementById('testText');
  const replacePatternInput = document.getElementById('replacePattern');
  const presetSelect = document.getElementById('presetSelect');

  const flagG = document.getElementById('flagG');
  const flagI = document.getElementById('flagI');
  const flagM = document.getElementById('flagM');
  const flagS = document.getElementById('flagS');
  const flagU = document.getElementById('flagU');

  const matchCountEl = document.getElementById('matchCount');
  const execTimeEl = document.getElementById('execTime');
  const regexStatusEl = document.getElementById('regexStatus');
  const highlightContainer = document.getElementById('highlightContainer');
  const replaceOutput = document.getElementById('replaceOutput');
  const groupsContainer = document.getElementById('groupsContainer');

  const PRESETS = {
    email: {
      pattern: '([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})',
      flags: 'gi',
      sample: 'Contact support@antigravity.io or sales-dept@company.co.uk for inquiries.'
    },
    url: {
      pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
      flags: 'gi',
      sample: 'Visit https://github.com or http://localhost:8080/api/v1/users'
    },
    ipv4: {
      pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
      flags: 'g',
      sample: 'Server IP: 192.168.1.1, Gateway: 10.0.0.254, Invalid: 999.300.1.1'
    },
    phone: {
      pattern: '\\b\\+?\\d{1,3}?[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b',
      flags: 'g',
      sample: 'Call +1 (555) 234-5678 or 123-456-7890 today.'
    },
    date: {
      pattern: '\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b',
      flags: 'g',
      sample: 'Release scheduled for 2026-08-13 and follow-up on 2026-12-25.'
    },
    hex: {
      pattern: '#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b',
      flags: 'g',
      sample: 'Primary accent: #6366f1, Secondary: #ec4899, Short: #fff'
    }
  };

  function testRegex() {
    const patternStr = regexPatternInput.value;
    const testText = testTextInput.value;
    const replacePattern = replacePatternInput.value;

    let flags = '';
    if (flagG.checked) flags += 'g';
    if (flagI.checked) flags += 'i';
    if (flagM.checked) flags += 'm';
    if (flagS.checked) flags += 's';
    if (flagU.checked) flags += 'u';

    if (!patternStr) {
      regexStatusEl.textContent = 'Empty Pattern';
      regexStatusEl.className = 'highlight-green';
      highlightContainer.innerHTML = escapeHtml(testText);
      replaceOutput.value = testText;
      matchCountEl.textContent = '0';
      execTimeEl.textContent = '0.0 ms';
      groupsContainer.innerHTML = '';
      return;
    }

    const t0 = performance.now();
    try {
      const regex = new RegExp(patternStr, flags);
      regexStatusEl.textContent = 'Valid Regex';
      regexStatusEl.className = 'highlight-green';

      // 1. Highlight Matches
      let matchCount = 0;
      let highlightedHTML = '';
      let lastIndex = 0;
      groupsContainer.innerHTML = '';

      if (flags.includes('g')) {
        let match;
        while ((match = regex.exec(testText)) !== null) {
          // Prevent infinite loops with zero-width matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
          matchCount++;

          // Append un-matched segment
          highlightedHTML += escapeHtml(testText.substring(lastIndex, match.index));
          // Append matched mark
          highlightedHTML += `<mark class="match-hl">${escapeHtml(match[0])}</mark>`;
          lastIndex = match.index + match[0].length;

          // Record Capture Groups
          addCaptureGroupCard(matchCount, match);
        }
        highlightedHTML += escapeHtml(testText.substring(lastIndex));
      } else {
        const match = regex.exec(testText);
        if (match) {
          matchCount = 1;
          highlightedHTML = escapeHtml(testText.substring(0, match.index)) +
            `<mark class="match-hl">${escapeHtml(match[0])}</mark>` +
            escapeHtml(testText.substring(match.index + match[0].length));
          addCaptureGroupCard(1, match);
        } else {
          highlightedHTML = escapeHtml(testText);
        }
      }

      const t1 = performance.now();

      highlightContainer.innerHTML = highlightedHTML || '<span class="placeholder-text">No matches found</span>';
      matchCountEl.textContent = matchCount.toString();
      execTimeEl.textContent = `${(t1 - t0).toFixed(2)} ms`;

      // 2. Perform Replacement
      if (replacePattern !== undefined) {
        replaceOutput.value = testText.replace(regex, replacePattern);
      }
    } catch (e) {
      regexStatusEl.textContent = 'Syntax Error';
      regexStatusEl.className = 'highlight-red';
      highlightContainer.innerHTML = `<span style="color:#f87171;">Regex Error: ${escapeHtml(e.message)}</span>`;
      replaceOutput.value = '';
      matchCountEl.textContent = '0';
      execTimeEl.textContent = '0.0 ms';
      groupsContainer.innerHTML = '';
    }
  }

  function addCaptureGroupCard(index, match) {
    if (match.length <= 1) return; // No capture groups
    const card = document.createElement('div');
    card.className = 'group-card';

    let groupDetails = match.slice(1).map((g, i) => `Group $${i + 1}: "${g || ''}"`).join(' | ');
    card.innerHTML = `<span>Match #${index}: "${escapeHtml(match[0])}"</span><strong>${escapeHtml(groupDetails)}</strong>`;
    groupsContainer.appendChild(card);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  presetSelect.addEventListener('change', (e) => {
    const key = e.target.value;
    if (PRESETS[key]) {
      const p = PRESETS[key];
      regexPatternInput.value = p.pattern;
      testTextInput.value = p.sample;
      flagG.checked = p.flags.includes('g');
      flagI.checked = p.flags.includes('i');
      flagM.checked = p.flags.includes('m');
      flagS.checked = p.flags.includes('s');
      flagU.checked = p.flags.includes('u');
      testRegex();
    }
  });

  const allInputs = [
    regexPatternInput, testTextInput, replacePatternInput,
    flagG, flagI, flagM, flagS, flagU
  ];

  allInputs.forEach(el => {
    el.addEventListener('input', testRegex);
    el.addEventListener('change', testRegex);
  });

  // Default sample setup
  const p = PRESETS.email;
  regexPatternInput.value = p.pattern;
  testTextInput.value = p.sample;
  testRegex();
});
