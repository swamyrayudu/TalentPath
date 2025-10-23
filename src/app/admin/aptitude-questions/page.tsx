
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
import { toast } from 'sonner';

interface Question {
  s_no: number;
  question: string;
  topic: string;
  category: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: string;
  explanation: string;
  [key: string]: string | number;
}

export default function AdminAptitudePage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    topic: '',
    category: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    answer: '',
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
  function startEdit(question: Question) {
    setEditingQuestionId(question.s_no);
    setShowAddForm(false);
    setFormData({
      question: question.question || '',
      topic: question.topic || '',
      category: question.category || '',
      option_a: question.option_a || '',
      option_b: question.option_b || '',
      option_c: question.option_c || '',
      option_d: question.option_d || '',
      answer: question.answer || '',
      explanation: question.explanation || '',
    });
  }

  // Cancel editing
  function cancelEdit() {
    setEditingQuestionId(null);
    setShowAddForm(false);
    setFormData({
      question: '',
      topic: '',
      category: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      answer: '',
      explanation: '',
    });
  }

  // Show add form
  function showAddQuestionForm() {
    setShowAddForm(true);
    setEditingQuestionId(null);
    setFormData({
      question: '',
      topic: '',
      category: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      answer: '',
      explanation: '',
    });
  }

  // Submit create or update
  async function submitForm() {
    if (!validateForm()) return;
    
    const url = '/api/admin/aptitude';
    
    try {
      // Use selectedTopic for new questions
      const questionData = {
        ...formData,
        topic: selectedTopic || formData.topic
      };

      let res;
      if (editingQuestionId) {
        res = await fetch(url, {
          method: 'PATCH',
          body: JSON.stringify({ 
            s_no: editingQuestionId, 
            ...questionData,
            topic: selectedTopic  // Ensure topic is passed for table selection
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        res = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(questionData),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = await res.json();
      
      if (data.success) {
        toast.success(editingQuestionId ? 'Question updated successfully' : 'Question created successfully');
        
        // Refresh the questions list
        if (selectedTopic) {
          setLoading(true);
          const refreshRes = await fetch(`/api/aptitude?topic=${selectedTopic}`);
          const refreshData = await refreshRes.json();
          if (refreshData.success) {
            setQuestions(refreshData.questions);
          }
          setLoading(false);
        }
        
        cancelEdit();
      } else {
        toast.error(data.error || 'Failed to save question');
      }
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(errorMessage);
    }
  }

// Validate form before submission
function validateForm() {
  if (!formData.question.trim()) {
    alert('Question text is required');
    return false;
  }
  if (!selectedTopic && !formData.topic) {
    alert('Topic is required');
    return false;
  }
  return true;
}


  // Delete question
  async function deleteQuestion(id: number) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const res = await fetch(`/api/admin/aptitude?s_no=${id}&topic=${encodeURIComponent(selectedTopic || '')}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Question deleted successfully');
        setQuestions(questions.filter(q => q.s_no !== id));
        if (editingQuestionId === id) cancelEdit();
      } else {
        toast.error(data.error || 'Failed to delete question');
      }
    } catch (error: unknown) {
      console.error('Error deleting question:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(errorMessage);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}


        {/* Topic Selection Card */}
        <Card className="max-w-4xl mx-auto mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Plus className="h-5 w-5 text-white" />
              </div>
              Select Topic
            </CardTitle>
            <CardDescription>
              Choose a topic to view and manage its questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTopic || ''} onValueChange={(value) => setSelectedTopic(value || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select Topic --" />
              </SelectTrigger>
              <SelectContent>
                {topics.map(topic => (
                  <SelectItem key={topic} value={topic}>
                    {topic.charAt(0).toUpperCase() + topic.slice(1).replace(/-/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
        </div>
      )}

        {!loading && selectedTopic && (
          <>
            {/* Questions List Header with Add Button */}
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Questions ({questions.length})
                </h2>
                {!showAddForm && !editingQuestionId && (
                  <Button 
                    onClick={showAddQuestionForm}
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </Button>
                )}
              </div>

              {/* Add Question Form (shown when showAddForm is true) */}
              {showAddForm && (
                <Card className="mb-6 shadow-lg border-2 border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      Add New Question
                    </CardTitle>
                    <CardDescription>
                      Fill in the details to create a new question
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Question *</label>
                        <Textarea 
                          name="question" 
                          placeholder="Enter your question here..." 
                          value={formData.question} 
                          onChange={handleInput} 
                          required
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Option A</label>
                          <Input 
                            name="option_a" 
                            placeholder="Option A" 
                            value={formData.option_a} 
                            onChange={handleInput} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Option B</label>
                          <Input 
                            name="option_b" 
                            placeholder="Option B" 
                            value={formData.option_b} 
                            onChange={handleInput} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Option C</label>
                          <Input 
                            name="option_c" 
                            placeholder="Option C" 
                            value={formData.option_c} 
                            onChange={handleInput} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Option D</label>
                          <Input 
                            name="option_d" 
                            placeholder="Option D" 
                            value={formData.option_d} 
                            onChange={handleInput} 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Correct Answer</label>
                        <Input 
                          name="answer" 
                          placeholder="e.g., A, B, C, or D" 
                          value={formData.answer} 
                          onChange={handleInput}
                          maxLength={1}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Explanation</label>
                        <Textarea 
                          name="explanation" 
                          placeholder="Explain the correct answer..." 
                          value={formData.explanation} 
                          onChange={handleInput}
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          onClick={submitForm} 
                          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                        >
                          <Plus className="w-4 h-4" />
                          Create Question
                        </Button>
                        <Button variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {questions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-muted-foreground">
                      <Plus className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No questions yet</p>
                      <p className="text-sm">Create your first question for this topic above.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <Card key={q.s_no} className={`group transition-all duration-300 ${
                      editingQuestionId === q.s_no ? 'shadow-xl border-2 border-amber-200' : 'hover:shadow-lg'
                    }`}>
                      {editingQuestionId === q.s_no ? (
                        // Edit Mode
                        <>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                                <Edit className="h-5 w-5 text-white" />
                              </div>
                              Editing Question {index + 1}
                            </CardTitle>
                            <CardDescription>
                              Update the question details below
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-1.5 block">Question *</label>
                                <Textarea 
                                  name="question" 
                                  placeholder="Enter your question here..." 
                                  value={formData.question} 
                                  onChange={handleInput} 
                                  required
                                  rows={3}
                                  className="resize-none"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium mb-1.5 block">Option A</label>
                                  <Input 
                                    name="option_a" 
                                    placeholder="Option A" 
                                    value={formData.option_a} 
                                    onChange={handleInput} 
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1.5 block">Option B</label>
                                  <Input 
                                    name="option_b" 
                                    placeholder="Option B" 
                                    value={formData.option_b} 
                                    onChange={handleInput} 
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1.5 block">Option C</label>
                                  <Input 
                                    name="option_c" 
                                    placeholder="Option C" 
                                    value={formData.option_c} 
                                    onChange={handleInput} 
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1.5 block">Option D</label>
                                  <Input 
                                    name="option_d" 
                                    placeholder="Option D" 
                                    value={formData.option_d} 
                                    onChange={handleInput} 
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1.5 block">Correct Answer</label>
                                <Input 
                                  name="answer" 
                                  placeholder="e.g., A, B, C, or D" 
                                  value={formData.answer} 
                                  onChange={handleInput}
                                  maxLength={1}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1.5 block">Explanation</label>
                                <Textarea 
                                  name="explanation" 
                                  placeholder="Explain the correct answer..." 
                                  value={formData.explanation} 
                                  onChange={handleInput}
                                  rows={3}
                                  className="resize-none"
                                />
                              </div>

                              <div className="flex gap-3 pt-4">
                                <Button 
                                  onClick={submitForm} 
                                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                                >
                                  <Edit className="w-4 h-4" />
                                  Update Question
                                </Button>
                                <Button variant="outline" onClick={cancelEdit}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </>
                      ) : (
                        // View Mode
                        <>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                    Q{index + 1}
                                  </span>
                                  {q.answer && (
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      Answer: {q.answer}
                                    </span>
                                  )}
                                </div>
                                <CardTitle className="text-lg group-hover:text-amber-600 transition-colors">
                                  {q.question}
                                </CardTitle>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Options Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {['option_a', 'option_b', 'option_c', 'option_d'].map((key) =>
                                  q[key] ? (
                                    <div 
                                      key={key} 
                                      className={`border-2 p-3 rounded-lg transition-all ${
                                        q.answer?.toLowerCase() === key.replace('option_', '') 
                                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                                          : 'border-border hover:border-amber-300'
                                      }`}
                                    >
                                      <span className="font-semibold text-amber-600">
                                        {key.replace('option_', '').toUpperCase()}.
                                      </span>{' '}
                                      {q[key]}
                                    </div>
                                  ) : null
                                )}
                              </div>

                              {/* Explanation */}
                              {q.explanation && (
                                <div className="p-3 rounded-lg bg-muted">
                                  <p className="text-sm font-medium mb-1">💡 Explanation:</p>
                                  <p className="text-sm text-muted-foreground">{q.explanation}</p>
                                </div>
                              )}

                              <Separator />

                              {/* Action Buttons */}
                              <div className="flex gap-3">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => startEdit(q)} 
                                  className="flex items-center gap-2 hover:bg-amber-50 hover:border-amber-300"
                                >
                                  <Edit className="w-4 h-4" /> Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => deleteQuestion(q.s_no)} 
                                  className="flex items-center gap-2"
                                >
                                  <Trash className="w-4 h-4" /> Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}






