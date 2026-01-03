import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  DateTimePicker,
  SearchableDropdown,
} from '@/components/common';
import type { SearchableDropdownOption } from '@/components/common';

/**
 * Component Demo Page
 * This component demonstrates all the UI components created in Task 5
 * It's useful for testing and showcasing the component library
 */
export const ComponentDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [dropdownValue, setDropdownValue] = useState('');

  const sampleOptions: SearchableDropdownOption[] = [
    {
      value: '1',
      label: 'John Doe',
      subtitle: 'Grade 9 - ID: 12345',
    },
    {
      value: '2',
      label: 'Jane Smith',
      subtitle: 'Grade 10 - ID: 12346',
    },
    {
      value: '3',
      label: 'Bob Johnson',
      subtitle: 'Grade 11 - ID: 12347',
    },
    {
      value: '4',
      label: 'Alice Williams',
      subtitle: 'Grade 12 - ID: 12348',
    },
  ];

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Component Library Demo</h1>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </CardContent>
      </Card>

      {/* Form Components */}
      <Card>
        <CardHeader>
          <CardTitle>Form Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormInput
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            helperText="We'll never share your email"
          />

          <FormInput
            label="Password"
            type="password"
            placeholder="Enter password"
            error="Password must be at least 8 characters"
          />

          <FormSelect
            label="Grade Level"
            value={selectValue}
            onChange={e => setSelectValue(e.target.value)}
            options={[
              { value: '9', label: '9th Grade' },
              { value: '10', label: '10th Grade' },
              { value: '11', label: '11th Grade' },
              { value: '12', label: '12th Grade' },
            ]}
          />

          <FormTextarea
            label="Notes"
            placeholder="Enter your notes here..."
            value={textareaValue}
            onChange={e => setTextareaValue(e.target.value)}
            rows={4}
            helperText="Maximum 500 characters"
          />

          <DateTimePicker
            label="Start Time"
            type="datetime-local"
            value={dateValue}
            onChange={setDateValue}
            helperText="Select the interaction start time"
          />

          <SearchableDropdown
            label="Select Student"
            placeholder="Search students..."
            options={sampleOptions}
            value={dropdownValue}
            onChange={value => setDropdownValue(value)}
            helperText="Start typing to filter students"
          />
        </CardContent>
      </Card>

      {/* Current Values */}
      <Card>
        <CardHeader>
          <CardTitle>Current Values</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md text-sm">
            {JSON.stringify(
              {
                input: inputValue,
                select: selectValue,
                textarea: textareaValue,
                date: dateValue,
                dropdown: dropdownValue,
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
