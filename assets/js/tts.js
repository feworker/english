'use strict';
window.MicrosoftTTS = {
  async synthesize(text, signal, voice = 'en-US-JennyNeural') {
    const endpoint = window.ENGLISH_TTS_ENDPOINT;
    if (!endpoint) throw new Error('微软语音服务尚未配置。');
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }), signal
    });
    if (!response.ok) throw new Error('微软语音合成暂时不可用，请稍后重试。');
    const blob = await response.blob();
    if (!blob.size || !blob.type.startsWith('audio/')) throw new Error('语音服务未返回有效音频。');
    return blob;
  }
};
