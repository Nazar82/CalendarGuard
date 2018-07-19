import { FilterByInputStringPipe } from './filter-by-input-string.pipe';

describe('FilterUsersPipe', () => {
  it('create an instance', () => {
    const pipe = new FilterByInputStringPipe();
    expect(pipe).toBeTruthy();
  });
});
