'use client';

import React, { useState, useRef, useEffect } from 'react';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Volume2, 
  VolumeX,
  Loader2,
  Radio,
  Settings,
  Waves,
  PhoneCall,
  MicOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface VoiceControlsProps {
  onTranscriptChange: (text: string) => void;
  onSpeakMessage: (speakFn: (text: string) => void) => void;
  disabled?: boolean;
}

export default function VoiceControls({ 
  onTranscriptChange, 
  onSpeakMessage,
  disabled = false 
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [autoReconnectError, setAutoReconnectError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const listeningRef = useRef(isListening);
  const voiceEnabledRef = useRef(voiceEnabled);
  const recognitionRunningRef = useRef(false);

  useEffect(() => {
    listeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Check browser support
  useEffect(() => {
    const supported = 
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
      ('speechSynthesis' in window);
    
    setIsSupported(supported);

    if (supported) {
      // Load available voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Try to find a good default voice (English, female, neural if available)
        const preferredVoice = voices.findIndex(v => 
          v.lang.startsWith('en') && 
          (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google'))
        );
        if (preferredVoice !== -1) {
          setVoiceIndex(preferredVoice);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognitionInstance = new SpeechRecognitionConstructor();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final.trim()) {
        setTranscript(prev => prev + final);
        onTranscriptChange(final.trim());
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Speech recognition error:', event.error);
      
      if (event.error === 'network') {
        setAutoReconnectError('Network hiccup detected. Reconnecting…');
        if (!recognitionRunningRef.current) {
          try {
            recognition.start();
            recognitionRunningRef.current = true;
          } catch (e) {
            console.log('Auto-restart failed:', e);
          }
        }
        return;
      }

      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setAutoReconnectError('No speech detected. Make sure your microphone is on.');
      }
      
      setIsListening(false);
      recognitionRunningRef.current = false;
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      if (listeningRef.current && voiceEnabledRef.current) {
        try {
          recognition.start();
          recognitionRunningRef.current = true;
        } catch (e) {
          console.log('Recognition restart failed:', e);
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, onTranscriptChange]);

  // Auto-start or stop the listener when voice mode toggles
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isSupported) return;

    if (voiceEnabled && !recognitionRunningRef.current) {
      try {
        setTranscript('');
        setInterimTranscript('');
        recognition.start();
        recognitionRunningRef.current = true;
        setIsListening(true);
        setAutoReconnectError(null);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setAutoReconnectError('Could not access microphone. Please check permissions.');
      }
    }

    if (!voiceEnabled && recognitionRunningRef.current) {
      recognition.stop();
      recognitionRunningRef.current = false;
      setIsListening(false);
    }
  }, [voiceEnabled, isListening, isSupported]);

  // Speak text using Text-to-Speech
  const speakText = React.useCallback((text: string) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text from markdown
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '[code block]') // Replace code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
      .replace(/[#*_~]/g, '') // Remove markdown symbols
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Convert links to text

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (availableVoices[voiceIndex]) {
      utterance.voice = availableVoices[voiceIndex];
    }
    
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, availableVoices, voiceIndex, speechRate, speechPitch]);

  // Stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Expose speakText to parent only once when voice is enabled
  useEffect(() => {
    if (voiceEnabled && autoSpeak) {
      onSpeakMessage(speakText);
    }
  }, [voiceEnabled, autoSpeak, onSpeakMessage, speakText]);

  if (!isSupported) {
    return (
      <Card className="border-yellow-500/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
            <MicOff className="h-4 w-4" />
            <span>Voice features not supported in your browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-4">
          {/* Voice Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-purple-500" />
              <span className="font-medium text-sm">Voice Interview Mode</span>
              {voiceEnabled && (
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300">
                  Connected
                </Badge>
              )}
            </div>
            <Switch
              checked={voiceEnabled}
              onCheckedChange={setVoiceEnabled}
              disabled={disabled}
            />
          </div>

          {voiceEnabled && (
            <>
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center">
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Live with AI Interviewer</p>
                      <p className="text-xs text-muted-foreground">Always listening — no button presses required</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-600 text-white flex items-center gap-1">
                    <Waves className="h-3 w-3" />
                    {isListening ? 'Listening' : 'Reconnecting'}
                  </Badge>
                </div>

                {autoReconnectError && (
                  <p className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                    {autoReconnectError}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isSpeaking ? stopSpeaking : () => {}}
                    disabled={!isSpeaking}
                    className="flex items-center justify-center gap-2"
                  >
                    {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    {isSpeaking ? 'Mute AI' : 'Awaiting reply'}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center justify-center gap-2">
                        <Settings className="h-4 w-4" />
                        Voice Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Voice Settings</DialogTitle>
                        <DialogDescription>
                          Customize your voice interview experience
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        {/* Auto-speak toggle */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto-speak">Auto-speak AI responses</Label>
                          <Switch
                            id="auto-speak"
                            checked={autoSpeak}
                            onCheckedChange={setAutoSpeak}
                          />
                        </div>

                        {/* Voice selection */}
                        <div className="space-y-2">
                          <Label>Voice</Label>
                          <select
                            value={voiceIndex}
                            onChange={(e) => setVoiceIndex(Number(e.target.value))}
                            className="w-full p-2 border rounded-md"
                          >
                            {availableVoices.map((voice, idx) => (
                              <option key={idx} value={idx}>
                                {voice.name} ({voice.lang})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Speech rate */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Speech Rate</Label>
                            <span className="text-sm text-muted-foreground">{speechRate.toFixed(1)}x</span>
                          </div>
                          <Slider
                            value={[speechRate]}
                            onValueChange={([value]) => setSpeechRate(value)}
                            min={0.5}
                            max={2.0}
                            step={0.1}
                          />
                        </div>

                        {/* Speech pitch */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Pitch</Label>
                            <span className="text-sm text-muted-foreground">{speechPitch.toFixed(1)}</span>
                          </div>
                          <Slider
                            value={[speechPitch]}
                            onValueChange={([value]) => setSpeechPitch(value)}
                            min={0.5}
                            max={2.0}
                            step={0.1}
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Live Transcript */}
              {(isListening || transcript || interimTranscript) && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {isListening && (
                      <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">
                      {isListening ? 'Listening...' : 'Transcript'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span>{transcript}</span>
                    {interimTranscript && (
                      <span className="text-muted-foreground italic"> {interimTranscript}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Status indicator */}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span>AI is speaking...</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
