class BehaviorTracker {
  constructor(apiService) {
      this.api = apiService;
      this.startTime = null;
      this.mouseMovements = 0;
      this.keystrokes = 0;
      this.pageViews = [];
      this.setupListeners();
  }

  setupListeners() {
      // Track mouse movements (throttled)
      let mouseTimeout;
      document.addEventListener('mousemove', () => {
          this.mouseMovements++;
          if (!mouseTimeout) {
              mouseTimeout = setTimeout(() => {
                  this.api.trackBehavior('mouse_movement', { 
                      count: this.mouseMovements 
                  }).catch(err => console.log('Mouse tracking error:', err));
                  mouseTimeout = null;
              }, 5000); // Send every 5 seconds
          }
      });

      // Track copy-paste
      document.addEventListener('copy', () => {
          this.api.trackBehavior('copy_paste', { 
              action: 'copy' 
          }).catch(err => console.log('Copy tracking error:', err));
      });

      document.addEventListener('paste', () => {
          this.api.trackBehavior('copy_paste', { 
              action: 'paste' 
          }).catch(err => console.log('Paste tracking error:', err));
      });
  }

  setupHoneypot() {
      // Create invisible honeypot elements
      const honeypot = document.createElement('div');
      honeypot.id = 'honeypot-trap';
      honeypot.style.display = 'none';
      honeypot.innerHTML = '<a href="/admin" id="fake-admin">Admin Panel</a>';
      
      honeypot.addEventListener('click', (e) => {
          e.preventDefault();
          this.api.trackBehavior('honeypot_click', { 
              element: 'hidden_admin_panel' 
          }).then(() => {
              window.location.href = '/honeypot';
          }).catch(err => console.log('Honeypot error:', err));
      });

      document.body.appendChild(honeypot);
  }

  trackLoginSpeed() {
      this.startTime = new Date().getTime();
      console.log('Login start tracked');
  }

  trackLoginComplete() {
      if (this.startTime) {
          const duration = new Date().getTime() - this.startTime;
          this.api.trackBehavior('login_speed', { 
              duration: duration 
          }).catch(err => console.log('Login speed error:', err));
      }
  }

  trackPageView(page) {
      this.pageViews.push({
          page,
          timestamp: new Date().toISOString()
      });

      this.api.trackBehavior('page_view', { 
          page: page 
      }).catch(err => console.log('Page view error:', err));
  }
}

export default BehaviorTracker;