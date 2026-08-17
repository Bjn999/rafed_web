export interface Feature {
  id: string;
  title: string;
  description: string;
  iconName: 'FolderKanban' | 'Users2' | 'Building2' | 'ShieldCheck' | 'Smartphone' | 'Zap';
  badge?: string;
}

export const featuresList: Feature[] = [
  {
    id: 'project-management',
    title: 'إدارة مشاريع المقاولات',
    description: 'خطط، تابع، ونفذ مشاريعك الهندسية والمقاولات في مكان واحد مع تتبع نسب الإنجاز والمراحل بدقة.',
    iconName: 'FolderKanban',
    badge: 'أساسي'
  },
  {
    id: 'multi-tenancy',
    title: 'مساحات عمل للمؤسسات',
    description: 'احصل على مساحة عمل مستقلة ومخصصة لشركتك مع خيارات ربط نطاقك الخاص لإدارة كاملة واحترافية.',
    iconName: 'Building2',
  },
  {
    id: 'team-collaboration',
    title: 'إدارة الموظفين والصلاحيات',
    description: 'أضف أعضاء فريقك، ووزع الأدوار والصلاحيات بما يتناسب مع الهيكل التنظيمي والمسؤوليات بمؤسستك.',
    iconName: 'Users2',
  },
  {
    id: 'high-security',
    title: 'أمان وتوثيق للبيانات',
    description: 'بيانات مشاريعك ومؤسستك مشفرة ومحمية بالكامل مع نسخ احتياطي دوري وصلاحيات وصول دقيقة لحماية خصوصيتك.',
    iconName: 'ShieldCheck',
  },
  {
    id: 'responsive-design',
    title: 'تصميم متجاوب بالكامل',
    description: 'تابع مشاريعك وتواصل مع فريقك من أي مكان، سواء كنت تستخدم الحاسوب في المكتب أو الهاتف في موقع العمل.',
    iconName: 'Smartphone',
    badge: 'نشط'
  },
  {
    id: 'fast-performance',
    title: 'سرعة وكفاءة استثنائية',
    description: 'نظام مبني بأحدث التقنيات ليوفر لك سرعة استجابة فائقة وتجربة مستخدم مريحة بدون أي تعقيد هندسي.',
    iconName: 'Zap',
  }
];
