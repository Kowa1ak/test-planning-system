export interface BoardTask {
  title: string;
  desc: string;
  priority: string;
  dueDate?: string;
  labelColors?: string[];
  checklists?: any[];
  attachments?: { name: string; file: File }[];
}

export interface BoardColumn {
  key: string;
  label: string;
}

export interface BoardMember {
  name: string;
  avatar: string;
}
