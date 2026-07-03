// ─────────────────────────────────────────────────────────────
// i18n — gettext-style. The English text IS the key.
// t(str) returns DICT[lang][str] ?? str  (falls back to English).
// English is the default; users toggle to Arabic (RTL).
// ─────────────────────────────────────────────────────────────
import { createElement, createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'brewzy-lang'

// Arabic dictionary. Only the `ar` map has entries; `en` is empty so the
// English source strings pass straight through.
const DICT = {
  en: {},
  ar: {
    // ── Page titles (nav.js PAGE_TITLES) ──
    'Operations Dashboard': 'لوحة العمليات',
    "Today's Route": 'مسار اليوم',
    'Machine Directory': 'دليل الماكينات',
    'Issue Tracker': 'متتبّع الأعطال',
    'Team Management': 'إدارة الفريق',
    'Access Control': 'التحكم في الصلاحيات',
    'Tasks Library': 'مكتبة المهام',
    'Empty Machine Protocol': 'بروتوكول تفريغ الماكينة',
    'Machine Empty Records': 'سجلات تفريغ الماكينات',
    'Empty Machine Checklist': 'قائمة تفريغ الماكينة',
    'Service History': 'سجل الصيانة',

    // ── Sidebar departments / sections / items ──
    'Operations': 'العمليات',
    'Dashboard': 'لوحة التحكم',
    'Issues': 'الأعطال',
    'Empty Records': 'سجلات التفريغ',
    'Team': 'الفريق',
    'Administration': 'الإدارة',
    'Empty Checklist': 'قائمة التفريغ',
    'Your Work': 'مهامك',
    'Sign Out': 'تسجيل الخروج',

    // ── Roles ──
    'manager': 'مدير',
    'operator': 'مشغّل',
    'technician': 'فني',
    'Manager': 'مدير',
    'Operator': 'مشغّل',
    'Technician': 'فني',

    // ── Topbar ──
    'Notifications': 'الإشعارات',
    'Mark all read': 'تعليم الكل كمقروء',
    'No notifications yet': 'لا توجد إشعارات بعد',
    'Toggle dark / light mode': 'تبديل الوضع الليلي / النهاري',
    'Switch language': 'تغيير اللغة',

    // ── App shell / boot ──
    'Connecting to Brewzy cloud…': 'جارٍ الاتصال بسحابة Brewzy…',
    'Couldn’t reach the database': 'تعذّر الوصول إلى قاعدة البيانات',
    'Check that Firestore and Anonymous Authentication are enabled in your Firebase project.':
      'تأكد من تفعيل Firestore والمصادقة المجهولة في مشروع Firebase الخاص بك.',

    // ── Login ──
    'Please enter your username.': 'الرجاء إدخال اسم المستخدم.',
    'Username': 'اسم المستخدم',
    'Enter your username': 'أدخل اسم المستخدم',
    'Password': 'كلمة المرور',
    'Enter your password': 'أدخل كلمة المرور',
    'Sign In': 'تسجيل الدخول',
    "Contact your manager if you don't have access": 'تواصل مع مديرك إذا لم يكن لديك صلاحية الوصول',
    'No account found with that username.': 'لا يوجد حساب بهذا اسم المستخدم.',
    'Incorrect password. Please try again.': 'كلمة المرور غير صحيحة. حاول مرة أخرى.',

    // ── Setup screen ──
    'One quick setup step': 'خطوة إعداد سريعة واحدة',
    'Brewzy stores its data in your own free Firebase project so every device stays in sync. Connect it once:':
      'يخزّن Brewzy بياناته في مشروع Firebase المجاني الخاص بك لتبقى جميع الأجهزة متزامنة. اربطه مرة واحدة:',
    'Create a free project at': 'أنشئ مشروعًا مجانيًا على',
    'Add a': 'أضف',
    'Web app': 'تطبيق ويب',
    ', then enable': '، ثم فعّل',
    'Firestore Database': 'قاعدة بيانات Firestore',
    'and': 'و',
    'Anonymous Authentication': 'المصادقة المجهولة',
    'Copy': 'انسخ',
    'to': 'إلى',
    'and paste your config values': 'وألصق قيم الإعداد الخاصة بك',
    'Restart the dev server': 'أعد تشغيل خادم التطوير',
    'Full instructions are in': 'التعليمات الكاملة موجودة في',

    // ── Enum: due status ──
    'Overdue': 'متأخرة',
    'Due Today': 'مستحقة اليوم',
    'Not Due': 'غير مستحقة',

    // ── Enum: machine status ──
    'Active': 'نشطة',
    'Inactive': 'غير نشطة',
    'Maintenance': 'صيانة',
    'Out of Service': 'خارج الخدمة',

    // ── Enum: issue status ──
    'Open': 'مفتوح',
    'In Progress': 'قيد المعالجة',
    'Resolved': 'تم الحل',

    // ── Enum: severity ──
    'Low': 'منخفضة',
    'Medium': 'متوسطة',
    'High': 'عالية',
    'Critical': 'حرجة',

    // ── Enum: duty ──
    'Morning': 'صباحي',
    'Evening': 'مسائي',
    'Both': 'كلاهما',

    // ── Enum: frequency ──
    'Daily': 'يومي',
    'Every 2 Days': 'كل يومين',
    'Every 3 Days': 'كل ٣ أيام',

    // ── Enum: record status ──
    'Completed': 'مكتمل',
    'Pending': 'قيد الانتظار',

    // ── Task frequency labels (FREQ_LABEL) ──
    'Every Visit': 'كل زيارة',
    'Every 2 Visits': 'كل زيارتين',
    'Every 3 Visits': 'كل ٣ زيارات',
    'Weekly': 'أسبوعي',
    'Technician Task': 'مهمة فني',

    // ── Emptying reasons ──
    'Moving machine to new location': 'نقل الماكينة إلى موقع جديد',
    'Deep maintenance': 'صيانة شاملة',
    'End of contract': 'انتهاء العقد',
    'Machine failure': 'عطل في الماكينة',
    'Scheduled relocation': 'نقل مجدول',
    'Other': 'أخرى',

    // ── Dashboard ──
    'Fleet overview and recent activity': 'نظرة عامة على الأسطول والنشاط الأخير',
    'Total Machines': 'إجمالي الماكينات',
    'Active fleet': 'الأسطول النشط',
    'Need service': 'بحاجة إلى صيانة',
    'Needs attention': 'بحاجة إلى انتباه',
    'Open Issues': 'الأعطال المفتوحة',
    'Under repair': 'تحت الإصلاح',
    'Need resolution': 'بحاجة إلى حل',
    'Services Today': 'صيانات اليوم',
    'Completed today': 'أُنجزت اليوم',
    'Fleet Health': 'حالة الأسطول',
    'Services — Last 7 Days': 'الصيانات — آخر ٧ أيام',
    'Operator Workload': 'حِمل عمل المشغّلين',
    'Technician Workload': 'حِمل عمل الفنيين',
    'Service Frequency': 'تكرار الصيانة',
    'Needs Attention': 'بحاجة إلى انتباه',
    'Recent Activity': 'النشاط الأخير',
    'Export CSV': 'تصدير CSV',
    'Print Report': 'طباعة التقرير',
    'Clear All': 'مسح الكل',
    'No services recorded this week yet': 'لا توجد صيانات مسجّلة هذا الأسبوع بعد',
    'No operators': 'لا يوجد مشغّلون',
    'No technicians': 'لا يوجد فنيون',
    'All clear!': 'كل شيء على ما يرام!',
    'No recent activity': 'لا يوجد نشاط حديث',
    'Clear activity log?': 'مسح سجل النشاط؟',
    'This permanently removes all activity entries. This cannot be undone.':
      'سيؤدي هذا إلى إزالة جميع إدخالات النشاط نهائيًا. لا يمكن التراجع عن هذا.',
    'Activity log cleared': 'تم مسح سجل النشاط',
    'Fleet summary exported': 'تم تصدير ملخص الأسطول',
    'Critical Issue': 'عطل حرج',
    'Delete': 'حذف',

    // ── Route ──
    'Your assigned machines': 'الماكينات المسندة إليك',
    'No machines assigned to you.': 'لا توجد ماكينات مسندة إليك.',
    'shift': 'وردية',
    'Last:': 'آخر صيانة:',
    'open issues': 'أعطال مفتوحة',
    'Maps': 'الخريطة',
    'Service': 'صيانة',
    'Issue': 'عطل',

    // ── Machines ──
    'Machines': 'الماكينات',
    'Manage machines, schedules and assignments': 'إدارة الماكينات والجداول والإسنادات',
    'Add Machine': 'إضافة ماكينة',
    'Search by name, location or ID…': 'ابحث بالاسم أو الموقع أو المعرّف…',
    'All Status': 'كل الحالات',
    'All Due': 'كل الاستحقاقات',
    'Machine': 'الماكينة',
    'Location': 'الموقع',
    'Duty': 'الوردية',
    'Freq.': 'التكرار',
    'Last Service': 'آخر صيانة',
    'Due Status': 'حالة الاستحقاق',
    'Machine Status': 'حالة الماكينة',
    'Actions': 'إجراءات',
    'Map': 'خريطة',
    'Tasks': 'المهام',
    'Edit': 'تعديل',
    'No machines found': 'لم يتم العثور على ماكينات',
    'Delete machine?': 'حذف الماكينة؟',
    'This will permanently delete': 'سيؤدي هذا إلى الحذف النهائي لـ',
    'this machine': 'هذه الماكينة',
    'along with its task list, service schedule, and all associated data. This action cannot be undone.':
      'مع قائمة مهامها وجدول صيانتها وجميع البيانات المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.',
    'Delete Machine': 'حذف الماكينة',
    'Machine deleted': 'تم حذف الماكينة',
    'Delete machine': 'حذف الماكينة',

    // ── Issues page ──
    'Track and resolve machine issues': 'تتبّع وحل أعطال الماكينات',
    'Report Issue': 'الإبلاغ عن عطل',
    'All Severity': 'كل مستويات الخطورة',
    'Description': 'الوصف',
    'Severity': 'الخطورة',
    'Status': 'الحالة',
    'Assigned To': 'مُسند إلى',
    'Reported By': 'أبلغ عنه',
    'Date': 'التاريخ',
    'View': 'عرض',
    'Resolve': 'حل',
    'No issues found': 'لم يتم العثور على أعطال',
    'Issue resolved': 'تم حل العطل',

    // ── Users ──
    'Team Members': 'أعضاء الفريق',
    'Manage operators, technicians and managers': 'إدارة المشغّلين والفنيين والمديرين',
    'Add Member': 'إضافة عضو',
    'Managers': 'المديرون',
    'Operators': 'المشغّلون',
    'Technicians': 'الفنيون',
    'Admin': 'مسؤول',
    'None yet': 'لا يوجد بعد',
    "Primary manager can't be removed": 'لا يمكن إزالة المدير الرئيسي',
    'Remove team member?': 'إزالة عضو الفريق؟',
    'and remove them from all assigned machines. They will no longer be able to log in. This cannot be undone.':
      'وإزالته من جميع الماكينات المسندة إليه. لن يتمكن من تسجيل الدخول بعد الآن. لا يمكن التراجع عن هذا.',
    'Remove Member': 'إزالة العضو',
    'Member removed': 'تمت إزالة العضو',
    'Remove': 'إزالة',

    // ── Access control ──
    'Choose which pages operators and technicians can see': 'اختر الصفحات التي يمكن للمشغّلين والفنيين رؤيتها',
    '🚗 Operator — Page Access': '🚗 المشغّل — صلاحية الصفحات',
    '🔧 Technician — Page Access': '🔧 الفني — صلاحية الصفحات',
    'View assigned machines and due status': 'عرض الماكينات المسندة وحالة الاستحقاق',
    'View, report and update issues': 'عرض الأعطال والإبلاغ عنها وتحديثها',
    'View past service records': 'عرض سجلات الصيانة السابقة',
    'Access the machine emptying checklist': 'الوصول إلى قائمة تفريغ الماكينة',
    'View the full machine list (read-only)': 'عرض قائمة الماكينات الكاملة (للقراءة فقط)',
    'access to': 'صلاحية الوصول إلى',
    'enabled': 'مُفعّلة',
    'disabled': 'مُعطّلة',

    // ── Tasks page ──
    'Managers only.': 'للمديرين فقط.',
    'Manage the task library and per-machine assignments': 'إدارة مكتبة المهام والإسنادات لكل ماكينة',
    'All Tasks': 'كل المهام',
    'tasks': 'مهام',
    'Add Task': 'إضافة مهمة',
    'No tasks yet. Click + Add Task.': 'لا توجد مهام بعد. اضغط + إضافة مهمة.',
    'Machine Tasks': 'مهام الماكينة',
    'Select a machine...': 'اختر ماكينة...',
    'Select a machine to manage its assigned tasks': 'اختر ماكينة لإدارة المهام المسندة إليها',
    'No tasks assigned. Add from the global list below.': 'لا توجد مهام مسندة. أضف من القائمة العامة أدناه.',
    'Add from Global Tasks': 'إضافة من المهام العامة',
    'Select a task...': 'اختر مهمة...',
    'Add': 'إضافة',
    'All global tasks are already assigned to this machine.': 'جميع المهام العامة مسندة بالفعل إلى هذه الماكينة.',
    'Delete task?': 'حذف المهمة؟',
    'this task': 'هذه المهمة',
    "will be permanently deleted from the library and removed from all machines it's assigned to. This cannot be undone.":
      'سيُحذف نهائيًا من المكتبة ويُزال من جميع الماكينات المسند إليها. لا يمكن التراجع عن هذا.',
    'Delete Task': 'حذف المهمة',
    'Task deleted': 'تم حذف المهمة',
    'Task removed from machine': 'تمت إزالة المهمة من الماكينة',
    'Task added to': 'تمت إضافة المهمة إلى',
    'Move up': 'تحريك لأعلى',
    'Move down': 'تحريك لأسفل',

    // ── History ──
    'Past service records across the fleet': 'سجلات الصيانة السابقة عبر الأسطول',
    'Date & Time': 'التاريخ والوقت',
    'Operator': 'المشغّل',
    'Completed Tasks': 'المهام المكتملة',
    'Online Checks': 'الفحوصات عبر الإنترنت',
    'Notes': 'الملاحظات',
    'Check1': 'فحص ١',
    'Check2': 'فحص ٢',
    'No service records yet': 'لا توجد سجلات صيانة بعد',
    'Exported service history': 'تم تصدير سجل الصيانة',

    // ── Empty protocol ──
    'Machine Emptying Protocol': 'بروتوكول تفريغ الماكينة',
    'Define the steps a worker must complete before a machine can be moved.':
      'حدّد الخطوات التي يجب على العامل إكمالها قبل نقل الماكينة.',
    'Assign to Operator': 'إسناد إلى مشغّل',
    'Protocol Steps': 'خطوات البروتوكول',
    'No steps yet. Add one below.': 'لا توجد خطوات بعد. أضف واحدة أدناه.',
    'Type a new step and press Enter…': 'اكتب خطوة جديدة واضغط Enter…',
    'Add Step': 'إضافة خطوة',
    'All steps above must be completed before a machine can be moved.':
      'يجب إكمال جميع الخطوات أعلاه قبل نقل الماكينة.',
    'Enter a step description': 'أدخل وصف الخطوة',
    'Step cannot be empty': 'لا يمكن أن تكون الخطوة فارغة',
    'Delete step?': 'حذف الخطوة؟',
    'This protocol step will be permanently removed. This cannot be undone.':
      'ستتم إزالة خطوة البروتوكول هذه نهائيًا. لا يمكن التراجع عن هذا.',
    'Delete Step': 'حذف الخطوة',

    // ── Empty records ──
    'History of machines emptied or scheduled for emptying.': 'سجل الماكينات التي تم تفريغها أو المجدولة للتفريغ.',
    'New Record': 'سجل جديد',
    'Reason': 'السبب',
    'Assigned To / Done By': 'مُسند إلى / نُفّذ بواسطة',
    'No empty records yet': 'لا توجد سجلات تفريغ بعد',

    // ── Empty checklist ──
    'Complete the emptying protocol before moving a machine.': 'أكمل بروتوكول التفريغ قبل نقل الماكينة.',
    'No pending machine emptying tasks assigned to you.': 'لا توجد مهام تفريغ ماكينات معلّقة مسندة إليك.',
    'Complete every step before moving the machine.': 'أكمل كل خطوة قبل نقل الماكينة.',
    'Select task to complete:': 'اختر المهمة لإكمالها:',
    'Reason:': 'السبب:',
    'steps completed': 'خطوات مكتملة',
    'No protocol steps configured yet.': 'لم يتم تكوين أي خطوات بروتوكول بعد.',
    'All steps complete — you can now record this machine as emptied.':
      'اكتملت جميع الخطوات — يمكنك الآن تسجيل هذه الماكينة كمُفرّغة.',
    'Submit & Record Completion': 'إرسال وتسجيل الإكمال',
    'Machine emptying recorded!': 'تم تسجيل تفريغ الماكينة!',

    // ── Generic modal / confirm ──
    'Cancel': 'إلغاء',
    'Close': 'إغلاق',
    'Save': 'حفظ',
    'Are you sure?': 'هل أنت متأكد؟',

    // ── Machine modal ──
    'Edit Machine': 'تعديل الماكينة',
    'Save Machine': 'حفظ الماكينة',
    'Machine Name': 'اسم الماكينة',
    'Machine ID': 'معرّف الماكينة',
    'Order Number': 'رقم الطلب',
    'Location / Place Name': 'الموقع / اسم المكان',
    'Maps Link': 'رابط الخريطة',
    '(optional)': '(اختياري)',
    'Operation Duty': 'وردية التشغيل',
    'Last Service Date': 'تاريخ آخر صيانة',
    'Assign Operator(s)': 'إسناد المشغّل(ين)',
    'Assign Technician': 'إسناد فني',
    'None': 'لا أحد',
    'No operators added yet': 'لم تتم إضافة مشغّلين بعد',
    'e.g. Al Matarat': 'مثال: المطارات',
    'e.g. M001': 'مثال: M001',
    'e.g. ORD-001': 'مثال: ORD-001',
    'Any notes...': 'أي ملاحظات...',
    'Machine name is required': 'اسم الماكينة مطلوب',
    'Machine ID is required': 'معرّف الماكينة مطلوب',
    'Location is required': 'الموقع مطلوب',
    'Machine ID must be unique': 'يجب أن يكون معرّف الماكينة فريدًا',
    'Machine updated': 'تم تحديث الماكينة',
    'Machine added': 'تمت إضافة الماكينة',

    // ── Issue modal ──
    'Edit Issue': 'تعديل العطل',
    'Save Issue': 'حفظ العطل',
    'Describe the issue...': 'صف العطل...',
    'Please describe the issue': 'الرجاء وصف العطل',
    'Assign To': 'إسناد إلى',
    '(select who needs to handle this)': '(اختر من يجب أن يتولى هذا)',
    'Select a machine first': 'اختر ماكينة أولًا',
    'No operators or technician assigned to this machine': 'لا يوجد مشغّلون أو فني مسند لهذه الماكينة',
    'Technician Response / Notes': 'رد الفني / ملاحظات',
    'Tech notes...': 'ملاحظات الفني...',
    'Resolution Notes': 'ملاحظات الحل',
    'How was it resolved?': 'كيف تم حله؟',
    'Photos': 'الصور',
    'Attach up to': 'أرفق حتى',
    'photos': 'صور',
    'Up to': 'حتى',
    'Issue updated': 'تم تحديث العطل',
    'Issue reported': 'تم الإبلاغ عن العطل',
    'Could not add that image': 'تعذّر إضافة تلك الصورة',
    'You were assigned an issue:': 'تم إسناد عطل إليك:',

    // ── Service modal ──
    'Service:': 'صيانة:',
    'Mark Complete': 'تعليم كمكتمل',
    'Visit #': 'الزيارة رقم',
    'Last service:': 'آخر صيانة:',
    'Service Checklist': 'قائمة فحص الصيانة',
    'No tasks due for this visit': 'لا توجد مهام مستحقة لهذه الزيارة',
    'Online Check 1 (12PM)': 'فحص عبر الإنترنت ١ (١٢ ظهرًا)',
    'Online Check 2 (12AM)': 'فحص عبر الإنترنت ٢ (١٢ منتصف الليل)',
    'All Ok': 'كل شيء على ما يرام',
    'There is a problem': 'توجد مشكلة',
    'Service Notes': 'ملاحظات الصيانة',
    'Any observations...': 'أي ملاحظات...',
    'Flag Technical Issue?': 'الإبلاغ عن عطل فني؟',
    'Flag an issue with this machine': 'الإبلاغ عن عطل في هذه الماكينة',
    'Issue Description': 'وصف العطل',
    'Service cycle completed': 'تم إكمال دورة الصيانة',
    'TECH': 'فني',

    // ── User modal ──
    'Edit Team Member': 'تعديل عضو الفريق',
    'Add Team Member': 'إضافة عضو فريق',
    'Save Member': 'حفظ العضو',
    'Full Name': 'الاسم الكامل',
    'Name': 'الاسم',
    'Role': 'الدور',
    'e.g. ahmad_op': 'مثال: ahmad_op',
    'Set password': 'عيّن كلمة مرور',
    "Please enter the member's full name.": 'الرجاء إدخال الاسم الكامل للعضو.',
    'Please set a username.': 'الرجاء تعيين اسم مستخدم.',
    'Please set a password.': 'الرجاء تعيين كلمة مرور.',
    'Password must be at least 4 characters.': 'يجب أن تتكون كلمة المرور من ٤ أحرف على الأقل.',
    'The primary admin account must stay as Manager.': 'يجب أن يبقى حساب المسؤول الرئيسي كمدير.',
    'is already taken. Choose another.': 'مستخدم بالفعل. اختر اسمًا آخر.',
    'Member updated': 'تم تحديث العضو',
    'Member added — assigned to all machines by default': 'تمت إضافة العضو — تم إسناده إلى جميع الماكينات افتراضيًا',

    // ── Global task modal ──
    'Edit Task': 'تعديل المهمة',
    'New Task': 'مهمة جديدة',
    'Save Task': 'حفظ المهمة',
    'Task Name': 'اسم المهمة',
    'Describe the task...': 'صف المهمة...',
    'Frequency': 'التكرار',
    'Quick Assign — Same Frequency': 'إسناد سريع — نفس التكرار',
    'machine(s) with': 'ماكينة بتكرار',
    'service frequency:': 'الصيانة:',
    'No machines with matching service frequency found.': 'لا توجد ماكينات بنفس تكرار الصيانة.',
    'Assign to all': 'إسناد للكل',
    'Selected': 'تم تحديد',
    'machines': 'ماكينات',
    'Assign to Machines': 'إسناد إلى الماكينات',
    '(check all that apply)': '(حدّد كل ما ينطبق)',
    'All': 'الكل',
    'Please enter a task name': 'الرجاء إدخال اسم المهمة',
    'Task updated': 'تم تحديث المهمة',
    'Task added': 'تمت إضافة المهمة',

    // ── Tasks modal (per-machine) ──
    'Save Tasks': 'حفظ المهام',
    'No tasks yet. Add one below.': 'لا توجد مهام بعد. أضف واحدة أدناه.',
    'Add New Task': 'إضافة مهمة جديدة',
    'Task description...': 'وصف المهمة...',
    'Remove task': 'إزالة المهمة',
    'Enter a task description first': 'أدخل وصف المهمة أولًا',
    'Tasks saved for': 'تم حفظ مهام',

    // ── Assign empty modal ──
    'Assign Emptying Task': 'إسناد مهمة تفريغ',
    'Assign Task': 'إسناد المهمة',
    'Machine to Empty': 'الماكينة المراد تفريغها',
    'Select machine...': 'اختر ماكينة...',
    '— select one or more': '— اختر واحدًا أو أكثر',
    'No operators or technicians in the system yet': 'لا يوجد مشغّلون أو فنيون في النظام بعد',
    'Select reason...': 'اختر السبب...',
    'New Location': 'الموقع الجديد',
    '(if relocating)': '(في حال النقل)',
    'e.g. King Fahd Road': 'مثال: طريق الملك فهد',
    'Any instructions for the assignees...': 'أي تعليمات للمكلفين...',
    'Select a machine': 'اختر ماكينة',
    'Set a date': 'حدّد تاريخًا',
    'Select a reason': 'اختر سببًا',
    'Select at least one person to assign': 'اختر شخصًا واحدًا على الأقل للإسناد',
    'Assigned to': 'تم الإسناد إلى',

    // ── Empty record modal ──
    'New Empty Machine Record': 'سجل تفريغ ماكينة جديد',
    'Create Record': 'إنشاء سجل',
    'Date of Emptying': 'تاريخ التفريغ',
    'Done By': 'نُفّذ بواسطة',
    'Select person...': 'اختر شخصًا...',
    'Reason for Emptying': 'سبب التفريغ',
    'Specify reason': 'حدّد السبب',
    'Enter reason...': 'أدخل السبب...',
    'Any additional notes...': 'أي ملاحظات إضافية...',
    'After saving, the assigned operator/technician can open the': 'بعد الحفظ، يمكن للمشغّل/الفني المسند فتح',
    "from Today's Route to complete the steps.": 'من مسار اليوم لإكمال الخطوات.',
    'Select a date': 'اختر تاريخًا',
    'Empty record created': 'تم إنشاء سجل التفريغ',

    // ── Issue detail modal ──
    'By:': 'بواسطة:',
    'Not assigned': 'غير مُسند',
    'Technician Response': 'رد الفني',

    // ── Inventory categories (inventorySeed.js INV_CATEGORIES) ──
    'Coffee Beans': 'حبوب القهوة',
    'Milk & Dairy': 'الحليب ومشتقاته',
    'Powders': 'المساحيق',
    'Syrups': 'الشراب المحلّى',
    'Cups & Lids': 'الأكواب والأغطية',
    'Consumables': 'المستهلكات',
    'Water': 'المياه',
    'Tea & Sugar': 'الشاي والسكر',
    'Spare Parts': 'قطع الغيار',

    // ── Inventory page ──
    'Inventory': 'المخزون',
    'Stock of coffee, milk, cups, syrups, water, cleaning supplies and spare parts':
      'مخزون القهوة والحليب والأكواب والشراب المحلّى والمياه ومستلزمات التنظيف وقطع الغيار',
    'Import starter catalog': 'استيراد الكتالوج المبدئي',
    'Add Item': 'إضافة صنف',
    'No inventory yet. Import the starter catalog to get going.':
      'لا يوجد مخزون بعد. استورد الكتالوج المبدئي للبدء.',
    'Imported': 'تم الاستيراد',
    'items': 'أصناف',
    'suppliers': 'موردون',
    'Total Items': 'إجمالي الأصناف',
    'Low Stock': 'مخزون منخفض',
    'Out of Stock': 'نفد المخزون',
    'Total Stock Value': 'إجمالي قيمة المخزون',
    'Stock Value by Category': 'قيمة المخزون حسب الفئة',
    'No stock value yet': 'لا توجد قيمة مخزون بعد',
    'Needs Restocking': 'يحتاج إعادة تخزين',
    'In stock': 'المتوفر',
    'In Stock': 'المتوفر',
    'Everything is well stocked': 'كل الأصناف متوفرة بكميات كافية',
    'Search by name, brand or vendor…': 'ابحث بالاسم أو العلامة التجارية أو المورّد…',
    'All Categories': 'كل الفئات',
    'OK': 'جيد',
    'Out': 'نافد',
    'Item': 'الصنف',
    'Pack': 'العبوة',
    'Price incl VAT': 'السعر شامل الضريبة',
    'Min': 'الحد الأدنى',
    'Value': 'القيمة',
    'Adjust': 'تعديل',
    'Reorder': 'إعادة الطلب',
    'No items found': 'لم يتم العثور على أصناف',
    'Standard Machine Fill': 'تعبئة الماكينة القياسية',
    'Hide': 'إخفاء',
    'Show': 'عرض',
    'Standard cost to stock one machine': 'التكلفة القياسية لتعبئة ماكينة واحدة',
    'Delete item?': 'حذف الصنف؟',
    'This action cannot be undone.': 'لا يمكن التراجع عن هذا الإجراء.',
    'Delete Item': 'حذف الصنف',
    'Item deleted': 'تم حذف الصنف',
    'Enter a quantity': 'أدخل الكمية',
    'Stock adjusted': 'تم تعديل المخزون',
    'Adjust Stock': 'تعديل المخزون',
    'Apply': 'تطبيق',
    'Current stock': 'المخزون الحالي',
    'Direction': 'الاتجاه',
    'Received (add)': 'استلام (إضافة)',
    'Used (subtract)': 'استهلاك (طرح)',
    'Quantity': 'الكمية',

    // ── Inventory item modal ──
    'Item updated': 'تم تحديث الصنف',
    'Item added': 'تمت إضافة الصنف',
    'Edit Item': 'تعديل الصنف',
    'Save Item': 'حفظ الصنف',
    'Item name': 'اسم الصنف',
    'Please enter a name': 'الرجاء إدخال اسم',
    'Unit': 'الوحدة',
    'Brand': 'العلامة التجارية',
    'Package Qty': 'كمية العبوة',
    'Packets per carton': 'عدد الأكياس في الكرتون',
    'Price excl VAT': 'السعر بدون ضريبة',
    'VAT': 'ضريبة القيمة المضافة',
    'Price per unit': 'سعر الوحدة',
    'In stock quantity': 'الكمية المتوفرة',
    'packs': 'عبوات',
    'Min level': 'الحد الأدنى',
    'reorder point': 'نقطة إعادة الطلب',
    'Bought on credit': 'تم الشراء بالآجل',

    // ── Procurement page ──
    'Procurement': 'المشتريات',
    'Suppliers and purchase orders — connected to Inventory': 'المورّدون وأوامر الشراء — مرتبطة بالمخزون',
    'New Purchase Order': 'أمر شراء جديد',
    'Open POs': 'أوامر الشراء المفتوحة',
    'Pending Value': 'القيمة المعلّقة',
    'Received this month': 'المستلم هذا الشهر',
    'Suppliers': 'المورّدون',
    'Spend Trend — Last 6 Months': 'اتجاه الإنفاق — آخر ٦ أشهر',
    'Received purchase order spend over the last 6 months': 'إنفاق أوامر الشراء المستلمة خلال آخر ٦ أشهر',
    'No received orders yet': 'لا توجد أوامر مستلمة بعد',
    'Purchase Orders by Status': 'أوامر الشراء حسب الحالة',
    'Spend by Supplier': 'الإنفاق حسب المورّد',
    'Add Supplier': 'إضافة مورّد',
    'No contact info': 'لا توجد معلومات اتصال',
    'No suppliers yet': 'لا يوجد موردون بعد',
    'Purchase Orders': 'أوامر الشراء',
    'Supplier': 'المورّد',
    'Items': 'الأصناف',
    'Total': 'الإجمالي',
    'Mark Ordered': 'تحديد كمطلوب',
    'Mark Received': 'تحديد كمستلم',
    'View/Edit': 'عرض/تعديل',
    'No purchase orders yet': 'لا توجد أوامر شراء بعد',
    'Marked as Ordered': 'تم التحديد كمطلوب',
    'PO received — stock updated': 'تم استلام أمر الشراء — تم تحديث المخزون',
    'Cancel purchase order?': 'إلغاء أمر الشراء؟',
    'This will cancel': 'سيؤدي هذا إلى إلغاء',
    'Cancel PO': 'إلغاء أمر الشراء',
    'Purchase order cancelled': 'تم إلغاء أمر الشراء',
    'Delete supplier?': 'حذف المورّد؟',
    'Delete Supplier': 'حذف المورّد',
    'Supplier deleted': 'تم حذف المورّد',

    // ── Purchase order modal ──
    'Please select a supplier': 'الرجاء اختيار مورّد',
    'Add at least one line item': 'أضف صنفًا واحدًا على الأقل',
    'Purchase order updated': 'تم تحديث أمر الشراء',
    'Purchase order created': 'تم إنشاء أمر الشراء',
    'Edit Purchase Order': 'تعديل أمر الشراء',
    'Save Purchase Order': 'حفظ أمر الشراء',
    'Select a supplier…': 'اختر مورّدًا…',
    'Line Items': 'بنود الأصناف',
    'Qty': 'الكمية',
    'Unit Cost': 'تكلفة الوحدة',
    'Select item…': 'اختر صنفًا…',
    'Add line': 'إضافة بند',
    'Subtotal': 'المجموع الفرعي',
    'Expected date': 'التاريخ المتوقع',

    // ── Supplier modal ──
    'Supplier updated': 'تم تحديث المورّد',
    'Supplier added': 'تمت إضافة المورّد',
    'Edit Supplier': 'تعديل المورّد',
    'Save Supplier': 'حفظ المورّد',
    'Supplier name': 'اسم المورّد',
    'Contact person': 'الشخص المسؤول',
    'Phone': 'الهاتف',

    // ── Access — security sign-in status panel ──
    'Security — Team Sign-in Status': 'الأمان — حالة تسجيل دخول الفريق',
    'ready': 'جاهز',
    'Everyone has signed in and has a secured account. You can now safely publish the strict database rules to lock out anyone outside your team.':
      'سجّل الجميع الدخول ولديهم حسابات مؤمّنة. يمكنك الآن نشر قواعد قاعدة البيانات الصارمة بأمان لمنع أي شخص خارج فريقك.',
    'Each member below needs to sign in once so their secured account is created. Wait until everyone shows ✅ before publishing the strict database rules.':
      'يحتاج كل عضو أدناه إلى تسجيل الدخول مرة واحدة لإنشاء حسابه المؤمّن. انتظر حتى يظهر ✅ بجانب الجميع قبل نشر قواعد قاعدة البيانات الصارمة.',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'en' } catch { return 'en' }
  })

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
  }, [lang])

  const setLang = (next) => setLangState(next === 'ar' ? 'ar' : 'en')

  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const t = (str) => (DICT[lang] && DICT[lang][str] != null ? DICT[lang][str] : str)

  return createElement(LanguageContext.Provider, { value: { t, lang, setLang, dir } }, children)
}

export function useT() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    // Safe fallback if used outside the provider.
    return { t: (s) => s, lang: 'en', setLang: () => {}, dir: 'ltr' }
  }
  return ctx
}
