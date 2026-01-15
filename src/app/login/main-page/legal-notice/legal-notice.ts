import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Legal Notice Component
 * 
 * Displays application legal information and disclaimers required by law.
 * Static informational component with no interactive functionality.
 * 
 * @component
 * @selector app-legal-notice
 * @standalone true
 */
@Component({
  selector: 'app-legal-notice',
  imports: [CommonModule],
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNotice {

}
