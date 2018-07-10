import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitRoleComponent } from './wait-role.component';

describe('WaitRoleComponent', () => {
  let component: WaitRoleComponent;
  let fixture: ComponentFixture<WaitRoleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WaitRoleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WaitRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
