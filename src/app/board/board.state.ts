import {
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  Injectable,
} from '@angular/core';
import { BoardTask, BoardColumn } from './board.model';
import { BoardMembers } from './board.members';
import { marked } from 'marked';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export interface BoardComment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  rendered: string;
  changed?: boolean;
  editing?: boolean;
}

export type LabelColor = string; // hex

export interface BoardChecklistItem {
  title: string;
  checked: boolean;
  hidden?: boolean; // для скрытия отмеченных
}
export interface BoardChecklist {
  title: string;
  items: BoardChecklistItem[];
}

@Injectable()
export class BoardState extends BoardMembers {
  todo: BoardTask[] = [
    { title: 'Сделать дизайн макета', desc: '', priority: 'MEDIUM' },
  ];
  inProgress: BoardTask[] = [
    { title: 'Разработка авторизации', desc: '', priority: 'HIGH' },
  ];
  done: BoardTask[] = [
    { title: 'Подготовить документацию', desc: '', priority: 'LOW' },
  ];
  columns: BoardColumn[] = [
    { key: 'todo', label: 'Нужно сделать' },
    { key: 'inProgress', label: 'В процессе' },
    { key: 'done', label: 'Готово' },
  ];
  priorities = [
    { key: 'LOWEST', label: 'Lowest' },
    { key: 'LOW', label: 'Low' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'HIGH', label: 'High' },
    { key: 'HIGHEST', label: 'Highest' },
  ];

  dragPreviewElement: HTMLElement | null = null;
  renderedMarkdown = '';
  @ViewChild('descArea') descArea?: ElementRef<HTMLTextAreaElement>;
  private needAutoGrow = false;
  private lastDescHeight = 80; // по умолчанию min-height
  newTaskDueDate: string = ''; // Добавлено: дата дедлайна
  showDatePicker: boolean = false; // Показывать ли календарь
  override taskMembers: { name: string; avatar: string }[] = [];
  override isJoined: boolean = false;
  protected cdr: ChangeDetectorRef;

  comments: BoardComment[] = [];
  newCommentText: string = '';
  editingCommentId: number | null = null;
  editingCommentText: string = '';

  currentUser = {
    name: 'You',
    avatar: '', // можно добавить ссылку на аватар или иконку
  };

  labelColors: LabelColor[] = [
    '#4787FF', // синий
    '#BEADF6', // сиреневый
    '#FFB300', // желтый
    '#FF6F61', // красный
    '#4CAF50', // зеленый
    '#FF69B4', // розовый
    '#8D6E63', // коричневый
    '#607D8B', // серый
  ];
  showLabelPicker = false;
  selectedLabelColors: LabelColor[] = [];

  showChecklistPicker = false;
  newChecklistTitle: string = '';
  checklistPickerPos: { top: number; left: number } | null = null;
  checklists: BoardChecklist[] = [];
  newChecklistItems: { [title: string]: string } = {}; // для новых элементов по чеклисту

  labelPickerPos: { top: number; left: number } | null = null;

  hiddenChecked: { [title: string]: boolean } = {}; // состояние "скрыть отмеченные" по чеклисту

  private checklistItemHover = new WeakMap<BoardChecklistItem, boolean>();

  showAttachmentPicker = false;
  attachmentPickerPos: { top: number; left: number } | null = null;
  attachments: { name: string; file: File }[] = [];

  closedColumns: Set<string> = new Set();

  constructor(cdr: ChangeDetectorRef) {
    super();
    this.cdr = cdr;
  }

  addTaskModalOpen = false;
  newTaskTitle = '';
  newTaskColumn: string = 'todo';
  newTaskDesc = '';
  newTaskPriority: string = 'MEDIUM'; // Добавлено: приоритет по умолчанию
  descInputFocused = false;
  columnSelectOpen = false;

  editTaskMode = false;
  editTaskIndex: number | null = null;
  editTaskColumn: string | null = null;

  addingColumn = false;
  newColumnName = '';

  showAddColumnInput() {
    this.addingColumn = true;
    this.newColumnName = '';
    setTimeout(() => {
      const input = document.querySelector(
        '.column-add-input'
      ) as HTMLInputElement;
      if (input) input.focus();
    });
  }

  confirmAddColumn() {
    const name = this.newColumnName.trim();
    if (!name) {
      this.addingColumn = false;
      this.newColumnName = '';
      return;
    }
    let baseKey = name.replace(/\s+/g, '').toLowerCase();
    let key = baseKey;
    let idx = 1;
    while (this.columns.some((c) => c.key === key)) {
      key = baseKey + idx;
      idx++;
    }
    this.columns.push({ key, label: name });
    (this as any)[key] = [];
    this.addingColumn = false;
    this.newColumnName = '';
    this.cdr.detectChanges();
  }

  cancelAddColumn() {
    this.addingColumn = false;
    this.newColumnName = '';
  }

  getColumnTasks(key: string) {
    return (this as any)[key] || [];
  }

  openTaskModal(column: string, index: number) {
    this.editTaskMode = true;
    this.addTaskModalOpen = true;
    this.editTaskIndex = index;
    this.editTaskColumn = column;
    let task = this.getColumnTasks(column)[index];
    this.newTaskTitle = task.title;
    this.newTaskDesc = task.desc;
    this.newTaskColumn = column;
    this.newTaskPriority = task.priority || 'MEDIUM';
    this.newTaskDueDate = this.getColumnTasks(column)[index].dueDate || '';
    this.selectedLabelColors = Array.isArray(task.labelColors)
      ? [...task.labelColors]
      : [];
    this.showLabelPicker = false;
    this.updateMarkdownPreview();
    this.columnSelectOpen = false;
    setTimeout(() => {
      this.lastDescHeight = this.descArea?.nativeElement.scrollHeight || 80;
    });
    // Загружаем комментарии для задачи (заглушка, можно расширить под задачу)
    this.comments = [];
    this.newCommentText = '';
    this.editingCommentId = null;
    this.editingCommentText = '';

    this.checklists = Array.isArray(task.checklists)
      ? JSON.parse(JSON.stringify(task.checklists))
      : [];
    this.showChecklistPicker = false;
    this.newChecklistTitle = '';
    this.newChecklistItems = {};

    this.attachments = Array.isArray(task.attachments)
      ? [...task.attachments]
      : [];
    this.showAttachmentPicker = false;
    this.attachmentPickerPos = null;
  }

  openAddTaskModal(column: string) {
    this.editTaskMode = false;
    this.addTaskModalOpen = true;
    this.newTaskTitle = '';
    this.newTaskColumn = column;
    this.newTaskDesc = '';
    this.newTaskPriority = 'MEDIUM';
    this.newTaskDueDate = '';
    this.selectedLabelColors = [];
    this.showLabelPicker = false;
    this.updateMarkdownPreview();
    this.columnSelectOpen = false;
    setTimeout(() => {
      this.lastDescHeight = 80;
    });
    this.comments = [];
    this.newCommentText = '';
    this.editingCommentId = null;
    this.editingCommentText = '';

    this.checklists = [];
    this.showChecklistPicker = false;
    this.newChecklistTitle = '';
    this.newChecklistItems = {};

    this.attachments = [];
    this.showAttachmentPicker = false;
    this.attachmentPickerPos = null;
  }

  closeAddTaskModal() {
    this.addTaskModalOpen = false;
    this.newTaskTitle = '';
    this.newTaskDesc = '';
    this.newTaskPriority = 'MEDIUM';
    this.editTaskMode = false;
    this.editTaskIndex = null;
    this.editTaskColumn = null;
    this.columnSelectOpen = false;
    this.lastDescHeight = 80;
  }

  getColumnLabel(key: string): string {
    const col = this.columns.find((c) => c.key === key);
    return col ? col.label : '';
  }

  selectColumn(key: string) {
    if (
      this.editTaskMode &&
      this.editTaskIndex !== null &&
      this.editTaskColumn &&
      this.editTaskColumn !== key
    ) {
      const task = this.getColumnTasks(this.editTaskColumn)[this.editTaskIndex];
      (this as any)[this.editTaskColumn] = [
        ...this.getColumnTasks(this.editTaskColumn).slice(
          0,
          this.editTaskIndex
        ),
        ...this.getColumnTasks(this.editTaskColumn).slice(
          this.editTaskIndex + 1
        ),
      ];
      (this as any)[key] = [...this.getColumnTasks(key), task];
      this.editTaskColumn = key;
      this.editTaskIndex = this.getColumnTasks(key).length - 1;
    }
    this.newTaskColumn = key;
    this.columnSelectOpen = false;
  }

  selectPriority(key: string) {
    this.newTaskPriority = key;
  }

  saveTask() {
    if (!this.newTaskTitle.trim()) return;
    const newTask = {
      title: this.newTaskTitle.trim(),
      desc: this.newTaskDesc,
      priority: this.newTaskPriority,
      dueDate: this.newTaskDueDate,
      labelColors: [...this.selectedLabelColors],
      checklists: JSON.parse(JSON.stringify(this.checklists)),
      attachments: [...this.attachments],
    };
    (this as any)[this.newTaskColumn] = [
      ...this.getColumnTasks(this.newTaskColumn),
      newTask,
    ];
    this.closeAddTaskModal();
    this.updateMarkdownPreview();
    this.cdr.markForCheck();
  }

  saveEditedTask() {
    if (
      this.editTaskIndex === null ||
      !this.editTaskColumn ||
      !this.newTaskTitle.trim()
    ) {
      return;
    }
    const title = this.newTaskTitle.trim();
    const desc = this.newTaskDesc;
    const priority = this.newTaskPriority;
    const dueDate = this.newTaskDueDate;
    const labelColors = [...this.selectedLabelColors];
    const checklists = JSON.parse(JSON.stringify(this.checklists));
    (this as any)[this.editTaskColumn][this.editTaskIndex] = {
      title,
      desc,
      priority,
      dueDate,
      labelColors,
      checklists,
      attachments: [...this.attachments],
    };
    this.closeAddTaskModal();
    this.updateMarkdownPreview();
    this.cdr.markForCheck();
  }

  saveTaskDesc() {
    this.descInputFocused = false;
  }

  cancelTaskDesc() {
    this.descInputFocused = false;
    this.newTaskDesc = '';
  }

  drop(event: CdkDragDrop<any[]>) {
    console.log('drop event', event);
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const prevColKey = this.columns.find(
        (col) => col.key + 'List' === event.previousContainer.id
      )?.key;
      const currColKey = this.columns.find(
        (col) => col.key + 'List' === event.container.id
      )?.key;
      if (prevColKey && currColKey) {
        const prevTasks = this.getColumnTasks(prevColKey);
        const currTasks = this.getColumnTasks(currColKey);
        const movedTask: { title: string; desc: string; priority: string } =
          prevTasks.splice(event.previousIndex, 1)[0];
        currTasks.splice(event.currentIndex, 0, movedTask);
        (this as any)[prevColKey] = [...prevTasks];
        (this as any)[currColKey] = [...currTasks];

        if (
          this.editTaskMode &&
          this.editTaskIndex !== null &&
          this.editTaskColumn === prevColKey &&
          movedTask.title === this.newTaskTitle &&
          movedTask.desc === this.newTaskDesc
        ) {
          this.editTaskColumn = currColKey;
          this.editTaskIndex = event.currentIndex;
          this.newTaskColumn = currColKey;
          this.newTaskPriority = movedTask.priority || 'MEDIUM';
        }
      }
    }
    this.todo = [...this.todo];
    this.inProgress = [...this.inProgress];
    this.done = [...this.done];
    this.cdr.detectChanges();
  }

  addSampleTask(column: string): void {
    this.openAddTaskModal(column);
  }

  autoGrowDesc(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    this.lastDescHeight = textarea.scrollHeight;
    this.updateMarkdownPreview();
  }

  onDescDisplayClick(el?: HTMLTextAreaElement) {
    this.descInputFocused = true;
    this.needAutoGrow = true;
  }

  ngAfterViewChecked() {
    if (this.descInputFocused && this.descArea && this.needAutoGrow) {
      const textarea = this.descArea.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
      this.needAutoGrow = false;
    }
    if (this.descInputFocused && this.descArea) {
      const textarea = this.descArea.nativeElement;
      textarea.style.height = this.lastDescHeight + 'px';
      if (textarea.scrollHeight > this.lastDescHeight) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        this.lastDescHeight = textarea.scrollHeight;
      }
    }
  }

  ngAfterViewInit() {
    const container = document.querySelector('.board-container') as HTMLElement;
    if (!container) return;

    let isDragging = false;
    let autoScrollTimer: any = null;
    let lastMouseX = 0;

    const observer = new MutationObserver(() => {
      isDragging = container.classList.contains('cdk-drop-list-dragging');
      if (!isDragging && autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
    });
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const SCROLL_ZONE = 60;
    const SCROLL_SPEED = 25;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      lastMouseX = e.clientX;
      const rect = container.getBoundingClientRect();
      let scrollDir = 0;
      if (e.clientX - rect.left < SCROLL_ZONE) scrollDir = -1;
      else if (rect.right - e.clientX < SCROLL_ZONE) scrollDir = 1;
      else scrollDir = 0;

      if (scrollDir !== 0 && !autoScrollTimer) {
        autoScrollTimer = setInterval(() => {
          if (!isDragging) {
            clearInterval(autoScrollTimer);
            autoScrollTimer = null;
            return;
          }
          const r = container.getBoundingClientRect();
          if (scrollDir === -1 && lastMouseX - r.left < SCROLL_ZONE) {
            container.scrollLeft -= SCROLL_SPEED;
          } else if (scrollDir === 1 && r.right - lastMouseX < SCROLL_ZONE) {
            container.scrollLeft += SCROLL_SPEED;
          } else {
            clearInterval(autoScrollTimer);
            autoScrollTimer = null;
          }
        }, 16);
      }
      if (scrollDir === 0 && autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
    };

    const onMouseLeave = () => {
      if (autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
  }

  updateMarkdownPreview() {
    this.renderedMarkdown = marked.parse(this.newTaskDesc || '', {
      async: false,
    }) as string;
  }

  getConnectedDropLists(currentKey: string): string[] {
    return this.columns
      .filter((c) => c.key !== currentKey)
      .map((c) => c.key + 'List');
  }

  openDatePicker(input: HTMLInputElement) {
    if (input.showPicker) {
      input.showPicker();
    } else {
      input.focus();
    }
  }

  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.newTaskDueDate = input.value;
    this.showDatePicker = false;
  }

  override joinTask() {
    super.joinTask();
  }

  override leaveTask() {
    super.leaveTask();
  }

  addComment() {
    const text = this.newCommentText.trim();
    if (!text) return;
    const comment: BoardComment = {
      id: Date.now(),
      user: this.currentUser.name,
      avatar: this.currentUser.avatar,
      text,
      rendered: marked.parse(text, { async: false }) as string,
      changed: false,
      editing: false,
    };
    this.comments.push(comment);
    this.newCommentText = '';
  }

  startEditComment(comment: BoardComment) {
    this.editingCommentId = comment.id;
    this.editingCommentText = comment.text;
    comment.editing = true;
  }

  saveEditComment(comment: BoardComment) {
    const text = this.editingCommentText.trim();
    if (!text) return;
    comment.text = text;
    comment.rendered = marked.parse(text, { async: false }) as string;
    comment.changed = true;
    comment.editing = false;
    this.editingCommentId = null;
    this.editingCommentText = '';
  }

  cancelEditComment(comment: BoardComment) {
    comment.editing = false;
    this.editingCommentId = null;
    this.editingCommentText = '';
  }

  toggleLabelPicker(event: MouseEvent) {
    event.stopPropagation();
    // Закрываем другие доп. блоки
    this.showChecklistPicker = false;
    this.checklistPickerPos = null;
    this.showAttachmentPicker = false;
    this.attachmentPickerPos = null;
    this.showLabelPicker = !this.showLabelPicker;
    if (this.showLabelPicker) {
      const btn = event.target as HTMLElement;
      const rect = btn.getBoundingClientRect();
      this.labelPickerPos = {
        top: rect.top + rect.height - 30,
        left: rect.left + rect.width + 20,
      };
    } else {
      this.labelPickerPos = null;
    }
  }

  toggleChecklistPicker(event: MouseEvent) {
    event.stopPropagation();
    // Закрываем другие доп. блоки
    this.showLabelPicker = false;
    this.labelPickerPos = null;
    this.showAttachmentPicker = false;
    this.attachmentPickerPos = null;
    this.showChecklistPicker = !this.showChecklistPicker;
    this.newChecklistTitle = '';
    if (this.showChecklistPicker) {
      const btn = event.target as HTMLElement;
      const rect = btn.getBoundingClientRect();
      this.checklistPickerPos = {
        top: rect.top + rect.height - 90,
        left: rect.left + rect.width + 20,
      };
    } else {
      this.checklistPickerPos = null;
    }
  }

  toggleLabelColor(color: LabelColor) {
    const idx = this.selectedLabelColors.indexOf(color);
    if (idx === -1) {
      this.selectedLabelColors.push(color);
    } else {
      this.selectedLabelColors.splice(idx, 1);
    }
  }

  addChecklist() {
    const title = this.newChecklistTitle.trim();
    if (!title) return;
    this.checklists.push({ title, items: [] });
    this.newChecklistTitle = '';
    this.showChecklistPicker = false;
    this.hiddenChecked[title] = false;
  }

  removeChecklist(cl: BoardChecklist) {
    this.checklists = this.checklists.filter((c) => c !== cl);
    delete this.hiddenChecked[cl.title];
  }

  removeChecklistItem(cl: BoardChecklist, item: BoardChecklistItem) {
    cl.items = cl.items.filter((i) => i !== item);
  }

  toggleHideChecked(cl: BoardChecklist) {
    this.hiddenChecked[cl.title] = !this.hiddenChecked[cl.title];
  }

  addChecklistItem(cl: BoardChecklist) {
    const val = (this.newChecklistItems[cl.title] || '').trim();
    if (!val) return;
    cl.items.push({ title: val, checked: false });
    this.newChecklistItems[cl.title] = '';
  }

  toggleChecklistItem(cl: BoardChecklist, item: BoardChecklistItem) {
    item.checked = !item.checked;
  }

  getChecklistProgress(cl: BoardChecklist): number {
    if (!cl.items.length) return 0;
    const done = cl.items.filter((i) => i.checked).length;
    return Math.round((done / cl.items.length) * 100);
  }

  itemMouseEnter(item: BoardChecklistItem) {
    this.checklistItemHover.set(item, true);
  }

  itemMouseLeave(item: BoardChecklistItem) {
    this.checklistItemHover.set(item, false);
  }

  isItemHovered(item: BoardChecklistItem): boolean {
    return !!this.checklistItemHover.get(item);
  }

  toggleAttachmentPicker(event: MouseEvent) {
    event.stopPropagation();
    // Закрываем другие доп. блоки
    this.showLabelPicker = false;
    this.labelPickerPos = null;
    this.showChecklistPicker = false;
    this.checklistPickerPos = null;
    this.showAttachmentPicker = !this.showAttachmentPicker;
    if (this.showAttachmentPicker) {
      const btn = event.target as HTMLElement;
      const rect = btn.getBoundingClientRect();
      this.attachmentPickerPos = {
        top: rect.top + rect.height - 90,
        left: rect.left + rect.width + 20,
      };
    } else {
      this.attachmentPickerPos = null;
    }
  }

  onAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        if (!this.attachments.some((a) => a.name === file.name)) {
          this.attachments.push({ name: file.name, file });
        }
      }
    }
    this.showAttachmentPicker = false;
    this.attachmentPickerPos = null;
    input.value = '';
    this.cdr.detectChanges();
  }

  removeAttachment(att: { name: string; file: File }) {
    this.attachments = this.attachments.filter((a) => a !== att);
    this.cdr.detectChanges();
  }

  toggleColumnClosed(colKey: string) {
    if (this.closedColumns.has(colKey)) {
      this.closedColumns.delete(colKey);
    } else {
      this.closedColumns.add(colKey);
    }
  }

  isColumnClosed(colKey: string): boolean {
    return this.closedColumns.has(colKey);
  }
}
