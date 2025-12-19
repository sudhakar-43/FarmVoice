/**
 * Audio recorder utility for capturing microphone input
 * Supports streaming and various audio formats
 */

export interface AudioRecorderConfig {
  sampleRate?: number;
  channelCount?: number;
  mimeType?: string;
  timeslice?: number;
}

export type AudioDataHandler = (data: Blob) => void;

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private dataHandlers: Set<AudioDataHandler> = new Set();
  private config: AudioRecorderConfig;

  constructor(config: AudioRecorderConfig = {}) {
    this.config = {
      sampleRate: 16000,
      channelCount: 1,
      mimeType: 'audio/webm;codecs=opus',
      timeslice: 100,
      ...config
    };
  }

  /**
   * Check if audio recording is supported
   */
  static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder === 'function'
    );
  }

  /**
   * Request microphone permission and initialize
   */
  async initialize(): Promise<void> {
    if (!AudioRecorder.isSupported()) {
      throw new Error('Audio recording is not supported in this browser');
    }

    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Find the best supported MIME type
      const mimeType = this.findSupportedMimeType();
      
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.dataHandlers.forEach(handler => handler(event.data));
        }
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
      };

    } catch (error) {
      throw new Error(`Failed to initialize audio recorder: ${error}`);
    }
  }

  /**
   * Find supported MIME type
   */
  private findSupportedMimeType(): string {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/wav'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return '';
  }

  /**
   * Start recording
   */
  start(): void {
    if (!this.mediaRecorder) {
      throw new Error('AudioRecorder not initialized. Call initialize() first.');
    }

    if (this.mediaRecorder.state === 'recording') {
      console.warn('Recording already in progress');
      return;
    }

    this.audioChunks = [];
    this.mediaRecorder.start(this.config.timeslice);
  }

  /**
   * Stop recording
   */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('AudioRecorder not initialized'));
        return;
      }

      if (this.mediaRecorder.state !== 'recording') {
        reject(new Error('Not currently recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        });
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Get current recording state
   */
  getState(): "inactive" | "recording" | "paused" {
    return this.mediaRecorder?.state || 'inactive';
  }

  /**
   * Register a data handler for streaming
   */
  onData(handler: AudioDataHandler): () => void {
    this.dataHandlers.add(handler);
    return () => this.dataHandlers.delete(handler);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.dataHandlers.clear();
  }

  /**
   * Get audio level/volume (for visualization)
   */
  async getAudioLevel(): Promise<number> {
    if (!this.audioStream) {
      return 0;
    }

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(this.audioStream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      
      audioContext.close();
      return average / 255; // Normalize to 0-1
    } catch (error) {
      console.error('Failed to get audio level:', error);
      return 0;
    }
  }
}

/**
 * Convert audio blob to base64
 */
export async function audioToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert audio blob to array buffer
 */
export async function audioToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return await blob.arrayBuffer();
}
