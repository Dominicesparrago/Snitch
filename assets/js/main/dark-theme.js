// Dark Theme Functionality for Snitch
document.addEventListener('DOMContentLoaded', function() {
  applyDarkTheme();
});

function applyDarkTheme() {
  // Add dark theme styles to the head section
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    /* Dark Theme Styles */
    body, .dashboard-container {
      background-color: #0e0e0e;
      color: #ffffff;
    }
    
    .sidebar {
      background-color: #0e0e0e;
      border-right: 1px solid #222;
    }
    
    .main-content {
      background-color: #0e0e0e;
    }
    
    .top-bar {
      background-color: #0e0e0e;
      border-bottom: 1px solid #222;
    }
    
    .search-bar {
      background-color: #1a1a1a;
      border: 1px solid #222;
    }
    
    .search-bar input {
      background-color: #1a1a1a;
      color: #ffffff;
    }
    
    .overview-card, .stat-card, .student-list, .activity-list {
      background-color: #1a1a1a !important;
      border: 1px solid #222;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }
    
    .student-item, .activity-item {
      border-bottom: 1px solid #222 !important;
    }
    
    .tab {
      color: #aaa;
    }
    
    .tab.active {
      color: #4a90e2;
    }
    
    .tab-content {
      background-color: transparent;
    }
    
    #debugOutput {
      background-color: #1a1a1a !important;
      color: #ffffff;
    }
    
    /* Additional Dark Theme Elements */
    h1, h2, h3, h4, p {
      color: #ffffff;
    }
    
    .btn {
      background-color: #1a1a1a;
    }
    
    a {
      color: #4a90e2;
    }
    
    /* Fix user-profile dropdown for dark theme */
    .profile-dropdown {
      color: #ffffff;
    }
    
    /* Stats cards */
    .stats-grid .stat-card {
      background-color: #1a1a1a;
      border: 1px solid #222;
    }
    
    /* Form elements */
    input, select, textarea {
      background-color: #1a1a1a;
      color: #ffffff;
      border: 1px solid #222;
    }
    
    /* Join classroom section */
    .join-class-section {
      background-color: #1a1a1a;
      border: 1px solid #222;
    }
    
    /* Assignment and activity cards */
    .assignment {
      background-color: #1a1a1a !important;
    }
    
    /* Activity badges */
    .activity-type-badge {
      color: white !important;
    }
    
    /* Student access history table */
    .students-history-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background-color: #1a1a1a;
      border: 1px solid #222;
    }
    
    .students-history-table th,
    .students-history-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #222;
    }
    
    .students-history-table th {
      background-color: #222;
      color: #ffffff;
      font-weight: 600;
    }
    
    .students-history-table tr:hover {
      background-color: #252525;
    }
  `;
  document.head.appendChild(styleTag);
  
  // Update specific elements that might be added dynamically
  document.querySelectorAll('.student-list, .activity-list').forEach(el => {
    el.style.backgroundColor = '#1a1a1a';
  });
} 