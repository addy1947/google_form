const SERVER_URL = 'https://google-form-server.onrender.com/api/answer';

function findAllMultipleChoiceQuestions() {
  const questions = [];
  const candidates = Array.from(
    document.querySelectorAll('input[type="radio"], div[role="radio"], .freebirdFormviewerComponentsQuestionRadioChoice')
  );
  const seen = new Set();

  for (const cand of candidates) {
    const container =
      cand.closest('div[role="listitem"], .freebirdFormviewerComponentsQuestionContainer, .freebirdFormviewerComponentsQuestionBaseRoot') ||
      cand.closest('div');
    if (!container || seen.has(container)) continue;
    seen.add(container);

    const optionEls = Array.from(
      container.querySelectorAll('div[role="radio"], input[type="radio"], .freebirdFormviewerComponentsQuestionRadioChoice, .exportLabel, label')
    );

    const options = optionEls
      .map(el => {
        if (!el) return '';
        const tag = el.tagName || '';
        
        // For div[role="radio"], use aria-label or data-value attribute
        if (el.getAttribute && el.getAttribute('role') === 'radio') {
          return el.getAttribute('aria-label') || el.getAttribute('data-value') || '';
        }
        
        // For input elements, try to find associated label
        if (tag.toUpperCase() === 'INPUT') {
          const id = el.id;
          if (id) {
            const lab = container.querySelector(`label[for="${id}"]`);
            if (lab && lab.innerText) return lab.innerText.trim();
          }
          const p = el.closest('div[role="radio"], .exportLabel') || el.parentElement || el.closest('div');
          return p ? (p.innerText || '').trim() : '';
        }
        return (el.innerText || '').trim();
      })
      .filter(Boolean);

    if (options.length > 0) {
      const qTextEl =
        container.querySelector('div[role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle') ||
        container.querySelector('h2, h3');
      const question = qTextEl ? (qTextEl.innerText || '').trim() : '';

      // Get the actual DOM id from the heading element or container
      let qid = null;
      if (qTextEl && qTextEl.id) {
        qid = qTextEl.id.trim();
      } else if (container.id) {
        qid = container.id.trim();
      } else {
        const insideInput = container.querySelector('input[type="radio"][name]');
        if (insideInput && insideInput.name) qid = insideInput.name.trim();
      }
      
      // Skip questions without a real ID
      if (!qid) {
        continue;
      }

      questions.push({ id: qid, question, options });
    }
  }

  return questions;
}

function normalizeText(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\d ]+/g, '').trim();
}

function fillAnswerForQuestion(questionId, answer) {
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

  // Get all radio inputs in this container
  const radioInputs = Array.from(container.querySelectorAll('input[type="radio"]'));
  const divRadios = Array.from(container.querySelectorAll('div[role="radio"]'));

  const normalizedAnswer = normalizeText(answer);

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

  // Log available options for debugging
  const availableOptions = radioInputs.map(r => getRadioLabel(r, container)).concat(
    divRadios.map(d => d.getAttribute('aria-label') || d.getAttribute('data-value') || '')
  ).filter(Boolean);
  
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

    const qs = findAllMultipleChoiceQuestions();
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
          
          if (id && ans) {
            const filled = fillAnswerForQuestion(id, ans);
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
