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
  const btn = document.createElement('button');
  btn.id = 'gf-helper-btn';
  btn.textContent = 'Ask AI';
  Object.assign(btn.style, {
    position: 'fixed',
    right: '18px',
    top: '18px',
    zIndex: 2147483647,
    background: '#1a73e8',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
  });

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';

    const qs = findAllQuestions();
    if (!qs || qs.length === 0) {
      btn.textContent = 'No questions';
      setTimeout(() => {
        btn.textContent = originalText;
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

        btn.textContent = `Filled ${filledCount}/${data.results.length}`;
      } else {
        btn.textContent = 'No results';
      }
    } catch (error) {
      btn.textContent = 'Error';
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = originalText;
    }, 3000);
  });

  document.body.appendChild(btn);
}

createButton();
