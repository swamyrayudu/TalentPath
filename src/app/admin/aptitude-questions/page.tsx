'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Trash, Edit, Loader2, Plus } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';


export default function AdminAptitudePage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    topic: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    explanation: '',
  });

  // Fetch topics initially
  useEffect(() => {
    fetch('/api/aptitude')
      .then(res => res.json())
      .then(data => {
        if (data.success) setTopics(data.topics);
      });
  }, []);

  // Fetch questions per selected topic
  useEffect(() => {
    if (!selectedTopic) return;

    setLoading(true);
    fetch(`/api/aptitude?topic=${selectedTopic}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setQuestions(data.questions);
      })
      .finally(() => setLoading(false));
  }, [selectedTopic]);

  // Handle form input for create/edit
  function handleInput(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // Start editing question by populating form
  function startEdit(question: any) {
    setEditingQuestionId(question.s_no);
    setFormData({
      question: question.question || '',
      topic: question.topic || '',
      option_a: question.option_a || '',
      option_b: question.option_b || '',
      option_c: question.option_c || '',
      option_d: question.option_d || '',
      explanation: question.explanation || '',
    });
  }

  // Cancel editing
  function cancelEdit() {
    setEditingQuestionId(null);
    setFormData({
      question: '',
      topic: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      explanation: '',
    });
  }

  // Submit create or update
  async function submitForm() {
    const url = '/api/admin/aptitude';
    let res;

    if (editingQuestionId) {
      res = await fetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ id: editingQuestionId, ...formData }),
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    if (data.success) {
      // Refresh questions after change
      if (selectedTopic) {
        setLoading(true);
        fetch(`/api/aptitude?topic=${selectedTopic}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) setQuestions(data.questions);
          })
          .finally(() => {
            setLoading(false);
            cancelEdit();
          });
      }
    } else {
      alert('Failed to save question');
    }
  }

  // Delete question
  async function deleteQuestion(id: number) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    const res = await fetch(`/api/admin/aptitude?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setQuestions(questions.filter(q => q.s_no !== id));
      if (editingQuestionId === id) cancelEdit();
    } else {
      alert('Failed to delete question');
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Admin Aptitude Questions</h1>
        <p className="text-muted-foreground mt-2">Manage aptitude questions by topic</p>
      </header>

<div className="mb-6">
  <label className="block mb-2 font-semibold">Select Topic</label>
  <Select value={selectedTopic || ''} onValueChange={(value) => setSelectedTopic(value || null)}>
    <SelectTrigger className="w-full max-w-xs border rounded p-2">
      <SelectValue placeholder="-- Select Topic --" />
    </SelectTrigger>
    <SelectContent>
    
      {topics.map(topic => (
        <SelectItem key={topic} value={topic}>
          {topic}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
        </div>
      )}

      {!loading && selectedTopic && (
        <>
          <Card className="mb-6">
            <CardContent>
              <CardTitle className="mb-4 text-lg">
                {editingQuestionId ? 'Edit Question' : 'Add New Question'}
              </CardTitle>

              <div className="space-y-4">
                <Input 
                  name="question" 
                  placeholder="Question text" 
                  value={formData.question} 
                  onChange={handleInput} 
                  required 
                />
                <Input 
                  name="topic" 
                  placeholder="Topic" 
                  value={formData.topic} 
                  onChange={handleInput} 
                  required 
                  disabled 
                />
                <Input 
                  name="option_a" 
                  placeholder="Option A" 
                  value={formData.option_a} 
                  onChange={handleInput} 
                />
                <Input 
                  name="option_b" 
                  placeholder="Option B" 
                  value={formData.option_b} 
                  onChange={handleInput} 
                />
                <Input 
                  name="option_c" 
                  placeholder="Option C" 
                  value={formData.option_c} 
                  onChange={handleInput} 
                />
                <Input 
                  name="option_d" 
                  placeholder="Option D" 
                  value={formData.option_d} 
                  onChange={handleInput} 
                />
                <Textarea 
                  name="explanation" 
                  placeholder="Explanation" 
                  value={formData.explanation} 
                  onChange={handleInput} 
                />

                <div className="flex gap-4">
                  <Button onClick={submitForm} className="flex items-center gap-2">
                    {editingQuestionId ? 'Update' : 'Create'} <Plus className="w-4 h-4" />
                  </Button>
                  {editingQuestionId && (
                    <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {questions.length === 0 && (
              <p className="text-center text-muted-foreground">No questions for this topic yet.</p>
            )}
            {questions.map(q => (
              <Card key={q.s_no}>
                <CardContent>
                  <CardHeader>
                    <CardTitle>{q.question}</CardTitle>
                    <CardDescription>{q.explanation}</CardDescription>
                  </CardHeader>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {['option_a', 'option_b', 'option_c', 'option_d'].map((key) =>
                      q[key] ? (
                        <div key={key} className="border p-2 rounded">
                          <strong>{key.replace('option_', '').toUpperCase()}:</strong> {q[key]}
                        </div>
                      ) : null
                    )}
                  </div>
                  <div className="flex gap-4 mt-4">
                    <Button size="sm" variant="outline" onClick={() => startEdit(q)} className="flex items-center gap-2">
                      <Edit className="w-4 h-4" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteQuestion(q.s_no)} className="flex items-center gap-2">
                      <Trash className="w-4 h-4" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}






