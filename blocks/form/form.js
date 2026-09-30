/*
 * Form block
 * Either a single link to a sheet (.json) with columns
 *   Label | Type | Name | Options | Required | Placeholder | Help
 * or authored rows with the same order of cells:
 *   [Label | Type | Name | Options | Required]
 * Types: fieldset (starts a group; Options = description), text, email, tel, number,
 * date, textarea, select, radio, checkbox, plaintext, submit.
 * A row whose first cell is "action" sets the form's submit URL (POSTed as JSON).
 */

let instance = 0;

function slugify(text) {
  return String(text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function splitOptions(value) {
  return String(value || '').split(/\s*[,\n]\s*/).map((o) => o.trim()).filter(Boolean);
}

function isTruthy(value) {
  return /^(true|yes|y|required|x|1)$/i.test(String(value || '').trim());
}

function rowsFromBlock(block) {
  return [...block.children].map((row) => {
    const cells = [...row.children].map((c) => c.textContent.trim());
    const [Label, Type, Name, Options, Required, Placeholder, Help] = cells;
    return {
      Label, Type, Name, Options, Required, Placeholder, Help,
    };
  });
}

async function rowsFromSheet(href) {
  const resp = await fetch(href);
  if (!resp.ok) return [];
  const json = await resp.json();
  return json.data || [];
}

function buildField(def, formId) {
  const type = slugify(def.Type || 'text');
  const name = slugify(def.Name || def.Label) || `field-${Math.random().toString(36).slice(2, 7)}`;
  const id = `${formId}-${name}`;
  const required = isTruthy(def.Required);
  const wrapper = document.createElement('div');
  wrapper.className = `form-field form-${type}-field`;

  if (type === 'plaintext') {
    const p = document.createElement('p');
    p.textContent = def.Label || def.Options || '';
    wrapper.append(p);
    return wrapper;
  }

  if (type === 'submit') {
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'button';
    button.textContent = def.Label || 'Submit';
    wrapper.append(button);
    return wrapper;
  }

  if (type === 'radio' || type === 'checkbox') {
    const group = document.createElement('fieldset');
    group.className = 'form-choice-group';
    const legend = document.createElement('legend');
    legend.textContent = def.Label || '';
    if (required) legend.dataset.required = 'true';
    group.append(legend);
    splitOptions(def.Options).forEach((option, i) => {
      const optId = `${id}-${i}`;
      const choice = document.createElement('div');
      choice.className = 'form-choice';
      const input = document.createElement('input');
      input.type = type;
      input.name = name;
      input.id = optId;
      input.value = option;
      if (required && type === 'radio') input.required = true;
      const label = document.createElement('label');
      label.htmlFor = optId;
      label.textContent = option;
      choice.append(input, label);
      group.append(choice);
    });
    wrapper.append(group);
    return wrapper;
  }

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = def.Label || name;
  if (required) label.dataset.required = 'true';

  let control;
  if (type === 'select') {
    control = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = def.Placeholder || 'Select';
    control.append(empty);
    splitOptions(def.Options).forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      control.append(opt);
    });
  } else if (type === 'textarea') {
    control = document.createElement('textarea');
  } else {
    control = document.createElement('input');
    control.type = ['email', 'tel', 'number', 'date'].includes(type) ? type : 'text';
  }
  control.id = id;
  control.name = name;
  control.required = required;
  if (def.Placeholder && type !== 'select') control.placeholder = def.Placeholder;
  wrapper.append(label, control);

  if (def.Help) {
    const help = document.createElement('p');
    help.className = 'form-help';
    help.textContent = def.Help;
    wrapper.append(help);
  }
  return wrapper;
}

function buildForm(defs, formId) {
  const form = document.createElement('form');
  form.id = formId;
  form.noValidate = false;
  let container = form;

  defs.forEach((def) => {
    if (!def.Label && !def.Type) return;
    if (slugify(def.Label) === 'action' && !def.Name) {
      form.dataset.action = def.Type;
      return;
    }
    if (slugify(def.Type) === 'fieldset') {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'form-group';
      const legend = document.createElement('legend');
      legend.textContent = def.Label;
      fieldset.append(legend);
      if (def.Options) {
        const desc = document.createElement('p');
        desc.className = 'form-group-description';
        desc.textContent = def.Options;
        fieldset.append(desc);
      }
      form.append(fieldset);
      container = fieldset;
      return;
    }
    container.append(buildField(def, formId));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    const status = form.querySelector('.form-status') || document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    form.append(status);
    if (!form.dataset.action) {
      status.textContent = 'Thank you.';
      return;
    }
    try {
      const resp = await fetch(form.dataset.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      status.textContent = resp.ok ? 'Thank you, your submission has been received.' : 'Sorry, something went wrong. Please try again.';
    } catch (err) {
      status.textContent = 'Sorry, something went wrong. Please try again.';
    }
  });

  return form;
}

export default async function decorate(block) {
  instance += 1;
  const formId = `form-${instance}`;
  const link = block.querySelector('a[href$=".json"]');
  const defs = link ? await rowsFromSheet(link.href) : rowsFromBlock(block);
  block.replaceChildren(buildForm(defs, formId));
}
