import {
  Component,
  ChangeDetectorRef,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BoardState } from './board.state';
import { marked } from 'marked';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent
  extends BoardState
  implements AfterViewChecked, AfterViewInit
{
  marked = marked;
  constructor(protected override cdr: ChangeDetectorRef) {
    super(cdr);
  }

  override ngAfterViewChecked() {
    super.ngAfterViewChecked?.();
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit?.();
  }
}
