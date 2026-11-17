/* V195: crash-recoverable backup import. Does not migrate or clear existing keys. */
(function (root) {
  'use strict';
  const store = root.localStorage;
  const PREFIX = 'gta6-assistant:v1:';
  const names = ['completed','favorites','read','recent','map-pins','routes','route-progress'];
  const journalKey = PREFIX + 'import-recovery-v195';
  function readJournal() {
    const raw = store.getItem(journalKey);
    if (raw === null) return null;
    const journal = JSON.parse(raw);
    if (journal?.schema !== 1 || !journal.before || typeof journal.before !== 'object' ||
        Object.keys(journal.before).length !== names.length ||
        names.some(name => !Object.prototype.hasOwnProperty.call(journal.before, name) ||
          (journal.before[name] !== null && typeof journal.before[name] !== 'string')))
      throw Error('Recovery journal invalid; saved progress left untouched');
    return journal.before;
  }
  function recover() {
    const before = readJournal();
    if (!before) return true;
    for (const name of names) {
      const key = PREFIX + name;
      if (before[name] === null) store.removeItem(key);
      else store.setItem(key, before[name]);
    }
    store.removeItem(journalKey);
    return true;
  }
  let ready = false;
  try { ready = recover(); }
  catch (error) { console.error('Backup recovery pending:', error); }
  function apply(items) {
    if (!ready) throw Error('RECOVERY_PENDING');
    if (!items || names.some(name => typeof items[name] !== 'string'))
      throw Error('INVALID_IMPORT');
    const before = {};
    for (const name of names) before[name] = store.getItem(PREFIX + name);
    // This single write must succeed BEFORE touching any progress value.
    store.setItem(journalKey, JSON.stringify({schema:1,before}));
    try {
      for (const name of names) store.setItem(PREFIX + name, items[name]);
      store.removeItem(journalKey);
    } catch (error) {
      try { recover(); }
      catch (recoveryError) {
        ready = false;
        console.error('Import rollback pending. Journal retained:', recoveryError);
        throw Error('RECOVERY_PENDING');
      }
      throw Error('WRITE_FAILED');
    }
  }
  root.viGuestSafeImport = {apply, recover};
})(window);
