// @ts-ignore
class ResamplingProcessor extends AudioWorkletProcessor {
  /**
   * @param {any} options
   */
  constructor(options) {
    super();
    this.targetSampleRate = options.processorOptions.targetSampleRate;
    // This will be set dynamically to the context's actual sample rate.
    // @ts-ignore
    this.inputSampleRate = sampleRate;
  }

  /**
   * Resamples the input audio buffer to the target sample rate.
   * @param {Float32Array} input
   * @returns {Float32Array}
   */
  resample(input) {
    if (this.inputSampleRate === this.targetSampleRate) {
      return input;
    }

    const ratio = this.inputSampleRate / this.targetSampleRate;
    const outputLength = Math.floor(input.length / ratio);
    const result = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const index = i * ratio;
      const indexPrev = Math.floor(index);
      const indexNext = Math.min(indexPrev + 1, input.length - 1);
      const fraction = index - indexPrev;

      const prevSample = input[indexPrev] ?? 0;
      const nextSample = input[indexNext] ?? 0;

      // Simple linear interpolation
      result[i] = prevSample + (nextSample - prevSample) * fraction;
    }
    return result;
  }

  /**
   * @param {Float32Array[][]} inputs
   */
  process(inputs) {
    const inputChannel = inputs?.[0]?.[0];

    if (inputChannel) {
      const resampledData = this.resample(inputChannel);
      if (resampledData.length > 0) {
        // @ts-ignore
        this.port.postMessage(resampledData);
      }
    }
    return true;
  }
}

// @ts-ignore
registerProcessor("resampling-processor", ResamplingProcessor);
