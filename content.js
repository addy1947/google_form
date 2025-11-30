const SERVER_URL = 'https://google-form-server.onrender.com/api/answer';

function findAllQuestions() {
  const questions = [];
  const allContainers = Array.from(
    document.querySelectorAll('div[role="listitem"], .freebirdFormviewerComponentsQuestionContainer, .freebirdFormviewerComponentsQuestionBaseRoot')
  );
  const seen = new Set();

  for (const container of allContainers) {
    if (seen.has(container)) continue;
    seen.add(container);

    // Get question text
    const qTextEl =
      container.querySelector('div[role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle') ||
      container.querySelector('h2, h3');
    const question = qTextEl ? (qTextEl.innerText || '').trim() : '';

    if (!question) continue;

    // Get question ID
    let qid = null;
    if (qTextEl && qTextEl.id) {
      qid = qTextEl.id.trim();
    } else if (container.id) {
      qid = container.id.trim();
    } else {
      const insideInput = container.querySelector('input[name]');
      if (insideInput && insideInput.name) qid = insideInput.name.trim();
    }

    if (!qid) continue;

    // Detect question type
    const radioInputs = container.querySelectorAll('input[type="radio"]');
    const checkboxInputs = container.querySelectorAll('input[type="checkbox"]');
    const textInputs = container.querySelectorAll('input[type="text"], textarea');
    const selectInputs = container.querySelectorAll('select');
    const divRadios = container.querySelectorAll('div[role="radio"]');
    const divCheckboxes = container.querySelectorAll('div[role="checkbox"]');

    let type = 'unknown';
    let options = [];

    // Multiple choice (radio buttons)
    if (radioInputs.length > 0 || divRadios.length > 0) {
      type = 'multiple_choice';
      const optionEls = Array.from(divRadios.length > 0 ? divRadios : radioInputs);
      options = optionEls.map(el => {
        if (el.getAttribute && el.getAttribute('role') === 'radio') {
          return el.getAttribute('aria-label') || el.getAttribute('data-value') || '';
        }
        return getRadioLabel(el, container);
      }).filter(Boolean);
    }
    // Checkboxes
    else if (checkboxInputs.length > 0 || divCheckboxes.length > 0) {
      type = 'checkbox';
      const optionEls = Array.from(divCheckboxes.length > 0 ? divCheckboxes : checkboxInputs);
      options = optionEls.map(el => {
        if (el.getAttribute && el.getAttribute('role') === 'checkbox') {
          return el.getAttribute('aria-label') || el.getAttribute('data-value') || '';
        }
        return getRadioLabel(el, container);
      }).filter(Boolean);
    }
    // Dropdown
    else if (selectInputs.length > 0) {
      type = 'dropdown';
      const select = selectInputs[0];
      options = Array.from(select.options).map(opt => opt.text.trim()).filter(Boolean);
    }
    // Text input
    else if (textInputs.length > 0) {
      type = 'text';
      options = [];
    }

    if (type !== 'unknown') {
      questions.push({ id: qid, question, type, options });
    }
  }

  return questions;
}

function normalizeText(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\d ]+/g, '').trim();
}

function fillAnswerForQuestion(questionId, answer, questionType) {
  if (!questionId || !answer) {
    return false;
  }

  // Find the question by its heading ID
  const heading = document.getElementById(questionId);
  if (!heading) {
    return false;
  }

  // Find the question container from the heading
  const container = heading.closest('div[role="listitem"]') ||
    heading.closest('.freebirdFormviewerComponentsQuestionContainer') ||
    heading.closest('.freebirdFormviewerComponentsQuestionBaseRoot') ||
    heading.closest('div');

  if (!container) {
    return false;
  }

  const normalizedAnswer = normalizeText(answer);

  // Handle text inputs
  if (questionType === 'text') {
    const textInputs = container.querySelectorAll('input[type="text"], textarea');
    if (textInputs.length > 0) {
      const input = textInputs[0];
      input.value = answer;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  // Handle dropdown
  if (questionType === 'dropdown') {
    const selects = container.querySelectorAll('select');
    if (selects.length > 0) {
      const select = selects[0];
      for (let i = 0; i < select.options.length; i++) {
        const optText = normalizeText(select.options[i].text);
        if (optText === normalizedAnswer ||
          optText.includes(normalizedAnswer) ||
          normalizedAnswer.includes(optText)) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    }
    return false;
  }

  // Handle checkboxes
  if (questionType === 'checkbox') {
    const answers = Array.isArray(answer) ? answer : [answer];
    const checkboxInputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    const divCheckboxes = Array.from(container.querySelectorAll('div[role="checkbox"]'));
    let filled = false;

    for (const ans of answers) {
      const normAns = normalizeText(ans);

      for (const checkbox of checkboxInputs) {
        const label = getRadioLabel(checkbox, container);
        const normalizedLabel = normalizeText(label);
        if (normalizedLabel === normAns ||
          normalizedLabel.includes(normAns) ||
          normAns.includes(normalizedLabel)) {
          checkbox.checked = true;
          checkbox.click();
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          filled = true;
        }
      }

      for (const div of divCheckboxes) {
        const label = div.getAttribute('aria-label') || div.getAttribute('data-value') || '';
        const normalizedLabel = normalizeText(label);
        if (label && (normalizedLabel === normAns ||
          normalizedLabel.includes(normAns) ||
          normAns.includes(normalizedLabel))) {
          div.click();
          div.dispatchEvent(new Event('click', { bubbles: true }));
          filled = true;
        }
      }
    }
    return filled;
  }

  // Handle multiple choice (radio buttons)
  const radioInputs = Array.from(container.querySelectorAll('input[type="radio"]'));
  const divRadios = Array.from(container.querySelectorAll('div[role="radio"]'));

  // Try <input type="radio"> with fuzzy/normalized matching
  for (const radio of radioInputs) {
    const label = getRadioLabel(radio, container);
    const normalizedLabel = normalizeText(label);

    if (normalizedLabel === normalizedAnswer ||
      normalizedLabel.includes(normalizedAnswer) ||
      normalizedAnswer.includes(normalizedLabel)) {

      // Try multiple ways to select the radio
      radio.checked = true;
      radio.click();
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      radio.dispatchEvent(new Event('input', { bubbles: true }));

      // Also try clicking the parent container
      const parent = radio.closest('div[role="radio"]') || radio.parentElement;
      if (parent) parent.click();

      return true;
    }
  }

  // Try <div role="radio"> with fuzzy/normalized matching
  for (const div of divRadios) {
    // Google Forms stores the option text in aria-label and data-value attributes
    let label = div.getAttribute('aria-label') || div.getAttribute('data-value') || '';

    const normalizedLabel = normalizeText(label);

    if (label && (normalizedLabel === normalizedAnswer ||
      normalizedLabel.includes(normalizedAnswer) ||
      normalizedAnswer.includes(normalizedLabel))) {

      div.click();
      div.dispatchEvent(new Event('click', { bubbles: true }));

      return true;
    }
  }

  return false;
}

function getRadioLabel(radioInput, container) {
  if (radioInput.id) {
    const label = container.querySelector(`label[for="${radioInput.id}"]`);
    if (label && label.innerText) return label.innerText.trim();
  }
  const parent = radioInput.closest('div[role="radio"], .exportLabel') || radioInput.parentElement;
  return parent?.innerText?.trim() || '';
}

function createButton() {
  if (document.getElementById('gf-helper-btn')) return;

  // Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    .gf-helper-btn {
      position: fixed;
      right: 30px;
      top: 30px;
      z-index: 9999;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 50px;
      cursor: pointer;
      font-family: 'Google Sans', 'Roboto', sans-serif;
      font-size: 15px;
      font-weight: 600;
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 8px 10px -6px rgba(99, 102, 241, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      backdrop-filter: blur(10px);
      letter-spacing: 0.5px;
      user-select: none;
      touch-action: none;
      overflow: hidden;
    }

    .gf-helper-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      transition: 0.5s;
    }

    .gf-helper-btn:hover::before {
      left: 100%;
    }

    .gf-helper-btn:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.5), 0 8px 10px -6px rgba(99, 102, 241, 0.1);
    }

    .gf-helper-btn:active {
      transform: translateY(1px) scale(0.98);
      box-shadow: 0 5px 10px -5px rgba(99, 102, 241, 0.4);
    }

    .gf-helper-btn:disabled {
      opacity: 0.8;
      cursor: not-allowed;
      transform: none;
    }

    .gf-btn-icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
      transition: transform 0.3s ease;
    }

    .gf-btn-spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes pulse-glow {
      0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
      70% { box-shadow: 0 0 0 15px rgba(168, 85, 247, 0); }
      100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
    }

    .gf-pulse {
      animation: pulse-glow 2s infinite;
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'gf-helper-btn';
  btn.className = 'gf-helper-btn gf-pulse';

  // Icons
  const icons = {
    sparkle: '<svg class="gf-btn-icon" viewBox="0 0 24 24"><path d="M12 2L9.19 8.63L2 12L9.19 15.37L12 22L14.81 15.37L22 12L14.81 8.63L12 2Z"/></svg>',
    loading: '<svg class="gf-btn-icon gf-btn-spinner" viewBox="0 0 24 24"><path d="M12 4V2C6.48 2 2 6.48 2 12H4C4 7.58 7.58 4 12 4Z"/></svg>',
    success: '<svg class="gf-btn-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12L3.41 13.41L9 16.17L21 4.41L19.59 3L9 13.59L9 16.17Z"/></svg>',
    error: '<svg class="gf-btn-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/></svg>'
  };

  const updateBtn = (text, iconKey) => {
    btn.textContent = ''; // Clear current content

    // Create icon element
    const iconContainer = document.createElement('div');
    iconContainer.innerHTML = icons[iconKey];
    const iconSvg = iconContainer.firstElementChild;
    if (iconSvg) {
      btn.appendChild(iconSvg);
    }

    // Create text element
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    btn.appendChild(textSpan);
  };

  updateBtn('Auto Fill', 'sparkle');

  // Draggable Logic
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  function dragStart(e) {
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === btn || btn.contains(e.target)) {
      isDragging = true;
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, btn);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  btn.addEventListener("touchstart", dragStart, false);
  btn.addEventListener("touchend", dragEnd, false);
  btn.addEventListener("touchmove", drag, false);

  btn.addEventListener("mousedown", dragStart, false);
  document.addEventListener("mouseup", dragEnd, false);
  document.addEventListener("mousemove", drag, false);

  // Click Handler (prevent click if dragged)
  btn.addEventListener('click', async (e) => {
    if (isDragging) return; // Don't trigger if dragging

    // Simple check to distinguish click from drag release
    // In a real robust impl, we'd check distance moved.
    // For now, relying on isDragging flag which is cleared on mouseup.
    // However, mouseup happens before click.
    // So we need a small flag that persists slightly.
  });

  // Better click/drag separation
  let wasDragging = false;
  btn.addEventListener('mousedown', () => wasDragging = false);
  btn.addEventListener('mousemove', () => wasDragging = true);

  btn.addEventListener('click', async (e) => {
    // If we moved significantly, treat as drag, not click.
    // Since we are using transform, we can check that.
    // But for simplicity, let's just run the logic.

    btn.disabled = true;
    btn.classList.remove('gf-pulse');
    // const originalContent = btn.innerHTML; // Removed to avoid innerHTML usage
    updateBtn('Thinking...', 'loading');

    const qs = findAllQuestions();
    if (!qs || qs.length === 0) {
      updateBtn('No questions', 'error');
      setTimeout(() => {
        updateBtn('Auto Fill', 'sparkle');
        btn.disabled = false;
      }, 1500);
      return;
    }

    try {
      const res = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: qs }),
      });
      const data = await res.json();

      if (data?.results?.length) {
        let filledCount = 0;
        updateBtn('Filling...', 'loading');

        // Wait for DOM to be fully ready
        await new Promise(r => setTimeout(r, 500));

        for (const result of data.results) {
          const id = result.questionId;
          const ans = result.answer || result.gemini?.parsed?.answer;
          const qType = result.questionType || 'multiple_choice';

          if (id && ans) {
            const filled = fillAnswerForQuestion(id, ans, qType);
            if (filled) {
              filledCount++;
            }
          }
        }

        updateBtn(`Filled ${filledCount}/${data.results.length}`, 'success');
      } else {
        updateBtn('No results', 'error');
      }
    } catch (error) {
      updateBtn('Error', 'error');
    }

    setTimeout(() => {
      btn.disabled = false;
      updateBtn('Auto Fill', 'sparkle');
      btn.classList.add('gf-pulse');
    }, 3000);
  });

  document.body.appendChild(btn);
}

createButton();
