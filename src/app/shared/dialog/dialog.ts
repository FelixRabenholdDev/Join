import { ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';

/**
 * Modal Dialog Wrapper Component
 * 
 * Reusable modal dialog component providing a standard popup/modal interface
 * with smooth open/close animations. Used as a wrapper for other dialog
 * components like task dialogs and contact dialogs.
 * 
 * Features:
 * - Configurable dialog width
 * - Smooth fade in/out animations (400ms duration)
 * - Click-outside-to-close functionality
 * - Prevents multiple close actions
 * - Emits closed event when dialog is fully closed
 * - Used for overlays and modal presentations
 * 
 * Animation States:
 * - Open: Dialog displayed with animation
 * - Closing: Transition state during close animation
 * - Closed: Dialog hidden and removed from display
 * 
 * @component
 * @selector app-dialog
 * @standalone true
 * 
 * @example
 * <app-dialog #dialog (closed)="onDialogClosed()">
 *   Dialog content goes here
 * </app-dialog>
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss'
})
export class Dialog {
  /**
   * Dialog width in CSS units
   * Can be set to any valid CSS width value (e.g., '480px', '50%', '90vw')
   * 
   * @input
   * @type {string}
   * @default '480px'
   */
  @Input() width = '480px';
  /**
   * Event emitted when dialog is completely closed
   * Emitted after close animation completes (400ms delay)
   * Use this to cleanup or refresh after dialog dismissal
   * 
   * @output
   * @type {EventEmitter<void>}
   * 
   * @example
   * (closed)="handleDialogClosed()"
   */
  @Output() closed = new EventEmitter<void>();

  /**
   * Tracks whether dialog is currently open/visible
   * 
   * @type {boolean}
   */
  isOpen = false;

  /**
   * Tracks whether dialog is in closing state (animating out)
   * Prevents multiple close attempts during animation
   * 
   * @type {boolean}
   */
  isClosing = false;

  constructor(private cdr: ChangeDetectorRef) {}
  

  /**
   * Closes the dialog with fade-out animation
   * 
   * Initiates smooth closing animation (400ms duration), prevents re-entry,
   * and emits closed event when animation completes. Safe to call multiple times.
   * 
   * @returns {void}
   * 
   * @example
   * this.dialog.close();
   * // Dialog fades out and disappears
   */
    close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.isClosing = false;
      this.isOpen = false;
      this.closed.emit();
      this.cdr.markForCheck();
    }, 400);
  }

  open(): void {
    this.isClosing = false;
    this.isOpen = true;
    this.cdr.markForCheck();
  }
}

