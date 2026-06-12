import { useState, useEffect } from 'react';
import { Combobox, InputBase, useCombobox, Loader } from '@mantine/core';
import { inputStyles } from '../../styles/mantine';
import type { MiscCategory } from '../../types/inventory';

interface CategorySelectProps {
  categories:       MiscCategory[];
  value:            number | null;
  onChange:         (id: number | null) => void;
  onCreateCategory: (name: string) => Promise<MiscCategory>;
}

export const CategorySelect = ({ categories, value, onChange, onCreateCategory }: CategorySelectProps) => {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });
  const [search,   setSearch]   = useState('');
  const [creating, setCreating] = useState(false);

  const selectedName = value ? (categories.find(c => c.id === value)?.name ?? '') : '';

  useEffect(() => {
    setSearch(selectedName);
  }, [selectedName]);

  const trimmed    = search.trim().toLowerCase();
  const filtered   = categories.filter(c => c.name.toLowerCase().includes(trimmed));
  const exactMatch = categories.some(c => c.name.toLowerCase() === trimmed);

  const options = filtered.map(c => (
    <Combobox.Option value={String(c.id)} key={c.id}>{c.name}</Combobox.Option>
  ));

  const handleSubmit = async (val: string) => {
    if (val === '$create') {
      setCreating(true);
      try {
        const newCat = await onCreateCategory(search.trim());
        onChange(newCat.id);
        setSearch(newCat.name);
      } finally {
        setCreating(false);
      }
    } else if (val === '$clear') {
      onChange(null);
      setSearch('');
    } else {
      const cat = categories.find(c => String(c.id) === val);
      if (cat) { onChange(cat.id); setSearch(cat.name); }
    }
    combobox.closeDropdown();
  };

  return (
    <Combobox store={combobox} withinPortal={false} onOptionSubmit={handleSubmit}>
      <Combobox.Target>
        <InputBase
          label="Category"
          placeholder="Search or add category..."
          rightSection={creating ? <Loader size="xs" /> : <Combobox.Chevron />}
          rightSectionPointerEvents="none"
          value={search}
          onChange={e => {
            setSearch(e.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value ? (categories.find(c => c.id === value)?.name ?? '') : '');
          }}
          styles={inputStyles}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {value && (
            <Combobox.Option value="$clear" style={{ color: 'var(--naja-teal)', fontSize: 13 }}>
              ✕ Clear selection
            </Combobox.Option>
          )}
          {options}
          {!exactMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create" style={{ color: 'var(--naja-gold)', fontSize: 13 }}>
              + Add "{search.trim()}"
            </Combobox.Option>
          )}
          {options.length === 0 && search.trim().length === 0 && (
            <Combobox.Empty style={{ color: 'var(--naja-teal)' }}>
              Type to search or create a category
            </Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
