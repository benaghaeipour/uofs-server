<totals>
  <stat val="{opts.stats.studentCount}" label="Students" icon="student icon"></stat>
  <stat val="{opts.stats.teacherCount}" label="Teachers" icon="user icon"></stat>
  <stat val="{opts.stats.centerCount}" label="Centers" icon="building outline icon"></stat>
</totals>

<stat>
  <div class="ui huge statistic">
    <div class="value">
      <i class="{opts.icon}"></i> 
      <span>{opts.val}</span>
    </div>
    <div class="label">{opts.label}</div>
  </div>
</stat>

<duplicates>
  <h1>{opts.stats.duplicateUserNames.length} duplicate usernames</h1>
  <ul>
    <li each="{user in opts.stats.duplicateUserNames}">Users: {user._id} - in centers: {user.center.join(',')}</li>
  </ul>

  <h1>{opts.stats.duplicateEmails.length} duplicate usernames</h1>
  <ul>
    <li each="{email in opts.stats.duplicateEmails}">Email: {email._id} - in centers: {email.center.join(',')}</li>
  </ul>
</duplicates>

<problems>
  <h2>Centers missing invoice numbers</h2>
  <div class="ui horizontal bulleted link list">
    <a each="{center in opts.stats.missingInvoices}" class="ui item" href="/admin/edit/{center._id}">{center.name}</a>
  </div>
</problems>