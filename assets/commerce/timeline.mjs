// The same clock drives the elevator and matching foreground panel.
export class CommerceTimeline {
  constructor(count = 4, hold = 6.5, duration = 1.35) {
    this.count = count;
    this.hold = hold;
    this.duration = duration;
    this.position = 0;
    this.source = 0;
    this.target = 0;
    this.elapsed = 0;
    this.dwell = 0;
    this.traveling = false;
  }
  get index() { return ((Math.round(this.position) % this.count) + this.count) % this.count; }
  get progress() { return this.traveling ? Math.min(1, this.elapsed / this.duration) : 0; }
  select(index, immediate = false) {
    const current = this.index;
    const normalized = ((index % this.count) + this.count) % this.count;
    let distance = normalized - current;
    if (distance > this.count / 2) distance -= this.count;
    if (distance < -this.count / 2) distance += this.count;
    this.source = this.position;
    this.target = Math.round(this.position) + distance;
    this.elapsed = this.dwell = 0;
    this.traveling = !immediate && Math.abs(this.target - this.source) > 0.001;
    if (!this.traveling) this.position = this.target;
  }
  next(immediate = false) {
    this.source = this.position;
    this.target = Math.round(this.position) + 1;
    this.elapsed = this.dwell = 0;
    this.traveling = !immediate;
    if (immediate) this.position = this.target;
  }
  advance(seconds, playing = true) {
    if (!playing) return;
    const dt = Math.max(0, Math.min(seconds, 0.1));
    if (!this.traveling) {
      this.dwell += dt;
      if (this.dwell >= this.hold) this.next();
      return;
    }
    this.elapsed += dt;
    const p = Math.min(1, this.elapsed / this.duration);
    const eased = p * p * (3 - 2 * p);
    this.position = this.source + (this.target - this.source) * eased;
    if (p >= 1) { this.position = this.target; this.traveling = false; this.elapsed = this.dwell = 0; }
  }
  // Wrap only beyond the visible tower window, making the loop seamless.
  offset(index) {
    return (((index - this.position + this.count / 2) % this.count) + this.count) % this.count - this.count / 2;
  }
}
