// Deque не может быть @Injectable() из-за generic параметра
// Используется как обычный класс
export class Deque<T> {
  private items: Record<number, T> = {};
  private head = 0;
  private tail = 0;

  pushFront(value: T) {
    this.head--;
    this.items[this.head] = value;
  }

  pushBack(value: T) {
    this.items[this.tail] = value;
    this.tail++;
  }

  popFront(): T | undefined {
    if (this.head === this.tail) return undefined;
    const value = this.items[this.head];
    delete this.items[this.head];
    this.head++;
    return value;
  }

  popBack(): T | undefined {
    if (this.head === this.tail) return undefined;
    this.tail--;
    const value = this.items[this.tail];
    delete this.items[this.tail];
    return value;
  }

  get size() {
    return this.tail - this.head;
  }

  toJSON() {
    const arr: T[] = [];
    for (let i = this.head; i < this.tail; i++) {
      if (i in this.items) arr.push(this.items[i]);
    }
    return arr;
  }
}
