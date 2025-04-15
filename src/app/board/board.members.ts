import { BoardMember } from './board.model';

export class BoardMembers {
  taskMembers: BoardMember[] = [];
  isJoined: boolean = false;

  joinTask() {
    if (!this.isJoined) {
      this.taskMembers.push({ name: 'Вы', avatar: '' });
      this.isJoined = true;
    }
  }

  leaveTask() {
    if (this.isJoined) {
      this.taskMembers = this.taskMembers.filter((m) => m.name !== 'Вы');
      this.isJoined = false;
    }
  }
}
