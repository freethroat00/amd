import { useState } from 'react';
import type { Note } from '../../types';
import './Notes.css';

interface NotesProps {
  notes: Note[];
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
}

export const Notes: React.FC<NotesProps> = ({ notes, onAdd, onRemove }) => {
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = () => {
    if (input.trim()) {
      onAdd(input);
      setInput('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { setShowInput(false); setInput(''); }
  };

  return (
    <div className="notes">
      <div className="notes-header">
        <span className="notes-title">заметки</span>
        <button className="notes-add-btn" onClick={() => setShowInput(true)}>+</button>
      </div>

      {showInput && (
        <div className="notes-input-wrap">
          <input
            className="notes-input"
            placeholder="новая заметка..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="notes-submit-btn" onClick={handleSubmit}>ok</button>
        </div>
      )}

      {notes.length === 0 && !showInput && (
        <div className="notes-empty">
          нажмите + чтобы добавить заметку
        </div>
      )}

      <div className="notes-list">
        {notes.map(note => (
          <div key={note.id} className="notes-card">
            <div className="notes-card-text">{note.text}</div>
            <button className="notes-card-del" onClick={() => onRemove(note.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};
