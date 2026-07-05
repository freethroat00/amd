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

  const handleSubmit = () => {
    if (input.trim()) {
      onAdd(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="notes">
      <div className="notes-header">
        <span className="notes-title">заметки</span>
      </div>

      <div className="notes-input-wrap">
        <input
          className="notes-input"
          placeholder="написать заметку..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

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
