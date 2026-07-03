// public/worklets/lufs-processor.js

class LufsProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // 48kHz স্যাম্পল রেটে প্রতি 100ms পরপর ফ্রেম আপডেট করবে
    this.updateIntervalInFrames = 48000 / 10;
    this.frameCount = 0;
    this.sumSquares = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input && input.length > 0) {
      const channelData = input[0]; // Left/Mono channel analysis

      for (let i = 0; i < channelData.length; i++) {
        this.sumSquares += channelData[i] * channelData[i];
      }
      this.frameCount += channelData.length;

      // 100ms পরপর মেইন থ্রেডে মেসেজ পাঠানো
      if (this.frameCount >= this.updateIntervalInFrames) {
        const rms = Math.sqrt(this.sumSquares / this.frameCount);

        // Convert RMS to dBFS (Momentary LUFS Proxy)
        // 0.00001 যোগ করা হয়েছে যাতে silence-এর সময় log(0) ইনফিনিটি এরর না দেয়
        let momentaryLufs = 20 * Math.log10(rms + 0.00001);

        this.port.postMessage({ lufs: momentaryLufs });

        // Reset for next block
        this.frameCount = 0;
        this.sumSquares = 0;
      }
    }

    // অডিও সিগন্যালটি স্পিকারে আউটপুট দেওয়ার জন্য পাস থ্রু করা
    const output = outputs[0];
    if (input && output) {
      for (let channel = 0; channel < input.length; channel++) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        if (inputChannel && outputChannel) {
          outputChannel.set(inputChannel);
        }
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor("lufs-processor", LufsProcessor);
