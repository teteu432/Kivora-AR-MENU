export class CameraManager {
  private stream: MediaStream | null = null

  async start(video: HTMLVideoElement): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('CAMERA_UNSUPPORTED')
    }

    this.stop()

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 30 },
      },
    })

    this.stream = stream
    video.srcObject = stream
    video.setAttribute('playsinline', 'true')
    video.muted = true

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('CAMERA_TIMEOUT')), 8000)
      const onReady = async () => {
        try {
          await video.play()
          window.clearTimeout(timer)
          resolve()
        } catch (error) {
          window.clearTimeout(timer)
          reject(error)
        }
      }

      if (video.readyState >= 2) void onReady()
      else video.addEventListener('loadedmetadata', onReady, { once: true })
    })

    return stream
  }

  stop() {
    if (!this.stream) return
    for (const track of this.stream.getTracks()) track.stop()
    this.stream = null
  }
}
