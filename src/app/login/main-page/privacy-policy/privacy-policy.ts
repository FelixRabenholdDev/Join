import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Privacy Policy Component
 * 
 * Displays the application's privacy policy and data handling practices.
 * Informs users about data collection, storage, and usage policies.
 * Static informational component with no interactive functionality.
 * 
 * @component
 * @selector app-privacy-policy
 * @standalone true
 */
@Component({
  selector: 'app-privacy-policy',
  imports: [CommonModule],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {

}
