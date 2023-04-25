export function transformJsonResume(rawResume: any, lang: string): any {
  const resume = JSON.parse(JSON.stringify(rawResume));

  const summaries = {
    fr_FR:
      "Ayant découvert l'informatique autour de mes 10 ans, j'ai fait de ma passion mon métier. Après une expérience de 4 ans en recherche en informatique graphique, je me suis désormais orienté vers les pratiques DevOps et le développement d'infrastructures cloud. Ce parcours atypique me permet d'approcher les défis quotidiens avec pragmatisme pour répondre au mieux aux besoins de l'entreprise, tout en développant des solutions logicielles robustes et maintenables.",
    en_US:
      "I started programming when I was around 10 years old, and I have now turned this passion into my career. After a 4 year experience in computer graphics research, I have now pivoted to DevOps practices and cloud infrastructure development. This atypical career path allows me to think critically about the daily challenges I am presented with, in order to answer the company's needs in the best way possible, while still ensuring we develop maintainable and robust software solutions.",
  };

  resume['basics']['summary'] = summaries[lang as keyof typeof summaries];

  resume['basics']['location']['address'] = 'Grenoble';
  resume['basics']['website'] = 'https://vtavernier.github.io/';
  resume['basics']['profiles'].push({
    url: 'https://github.com/vtavernier',
    username: 'vtavernier',
    network: 'GitHub',
  });

  resume['basics']['image'] =
    'https://fr.gravatar.com/userimage/127848543/864afa84ea03b14ad5f0add922d15ff6.jpg?size=400';

  resume['meta']['theme'] = 'kendall';

  for (const work of resume['work']) {
    if (work['endDate'] == '') {
      if (!('summary' in work)) {
        work['delete'] = true;
      }

      delete work['endDate'];
    }

    const summary = work['summary'];
    if (summary) {
      const parts = summary.split(/\n\n/);
      work['summary'] = parts[0];
      if (parts.length > 1) {
        work['highlights'] = parts[1].split(/\n/).map((highlight: string) => highlight.replace(/^- /, ''));
      }
      if (parts.length > 2) {
        work['highlights'].push(...parts[2].split(/\n/));
      }
    }
  }

  resume['work'] = resume['work'].filter((work: any) => !work['delete']);

  resume['languages'] = resume['languages'].filter((lang: any) => lang.language.length > 2);

  resume['education'] = resume['education'].map((education: any) => ({ ...education, score: '' }));

  resume['skills'] = resume['skills']
    .map((skill: any) => ({
      ...skill,
      ...((
        {
          'Julia (langage de programmation)': {
            name: 'Julia',
          },
          Elasticsearch: {
            delete: true,
          },
          'Développement Open Source': {
            name: 'Open Source',
          },
          'Intégration continue': {
            delete: true,
          },
          'Intégration continue et livraison continue (CI/CD)': {
            name: 'CI/CD',
          },
          'OpenGL Shading Language': {
            name: 'OpenGL GLSL',
          },
        } as any
      )[skill.name] || {}),
    }))
    .filter((skill: any) => !skill['delete']);

  // TODO: Include it actually?
  resume['awards'] = [];

  // TODO: Replace ensiwki links with something else?
  resume['projects'] = resume['projects'].map((project: any) => {
    if (project['url'] && project['url'].includes('ensiwiki')) {
      delete project['url'];
    }

    return project;
  });

  if (lang == 'en_US') {
    const awards = {
      'Première place au concours GEM IBM Watson': {
        title: 'First place in GEM IBM Watson challenge',
        awarder: 'IBM and Grenoble Ecole de Management',
        summary: "Brainstorming and ideation of a solution using cognitive artifical intelligence in today's world.",
      },
    };

    const projects = {
      'Rendu de panorama de plans de ski "à la Novat"': {
        name: "Texturing and shading of mountain panoramas in Pierre Novat's style",
        summary:
          'Study of the specifities of texturing and lighting digital mountain panoramas in the style of Pierre Novat.',
      },
      'Création de panoramas de montagnes "à la Novat" à partir de modèle numérique de terrain': {
        name: 'Rendering of moutain panoranams from digital terrain data in the style of Pierre Novat',
        summary:
          'Study of various aspects related to the geometry rendering of mountain panoramas in the style of the famous artist Pierre Novat based on digital relief data.',
      },
      'Suivi de personne pour robot de téléprésence': {
        name: 'Person follower algorithm for telepresence robot',
        summary:
          'Development of a person following algorithm for a telepresence robot using traditional computer vision techniques. This was used to help driving the telepresence robot automatically, for example if someone is giving a tour of a place to a remote attendee.',
      },
      "Site internet pour l'associatif de l'Ensimag": {
        name: "Website for Ensimag's students' office",
        summary:
          'Development of a web application to promote associative activity at Ensimag. This Ruby on Rails application allowed various actors to publish their events, blog posts and introduce their sponsors.',
      },
    };

    resume['awards'] = resume['awards'].map((award: any) => ({
      ...award,
      ...awards[award.title as keyof typeof awards],
    }));

    resume['projects'] = resume['projects'].map((project: any) => ({
      ...project,
      ...projects[project.name as keyof typeof projects],
    }));

    // Fix french leftover in languages
    resume['languages'] = resume['languages'].map((lang: any) => ({
      ...lang,
      language: { Anglais: 'English', Français: 'French' }[lang.language as string] || lang.language,
    }));

    // Fix french leftover in skills
    resume['skills'] = resume['skills'].map((skill: any) => ({
      ...skill,
      name:
        {
          Virtualisation: 'Virtualization',
        }[skill.name as string] || skill.name,
    }));
  }

  resume['skills'].sort((a: any, b: any) => a.name.localeCompare(b.name));

  return resume;
}
