const r = require('../rethinkdb');
const languages = require('../data/languages.json');
const categories = require('../data/categories.json');

const selectableLanguages = Object.keys(languages);

const localise = (item, res) => {
  if (item.contents[res.getLocale()]) {
    item.contents = item.contents[res.getLocale()];
    return item;
  }
  const availableLanguages = Object.keys(languages).sort((a, b) => {
    if (a.priority < b.priority) {
      return -1;
    } else if (a.priority > b.priority) {
      return 1;
    }
    return 0;
  });

  for (let i = 0; i < availableLanguages.length; i += 1) {
    // Try all languages in priority order.
    if (item.contents[availableLanguages[i]]) {
      item.contents = item.contents[availableLanguages[i]];
      item.pageDisplayedLanguage = availableLanguages[i];
      return item;
    }
  }

  throw new Error('Cannot find any languages for this bot!');
};

const operators = /[|\\{}()[\]^$+*?.]/g;
const sanitise = string => `(?i)${string.trim().toLowerCase().replace(operators, '\\$&')}`;

const listMiddleware = options => (req, res, next) => {
  let filter = options.filter || {};
  const query = req.query.q || '';
  const state = req.query.state || 'approved';
  const category = req.query.category || '';
  const owners = req.query.owners || [];
  let title = null;

  const checkDatabase = () => {
    const limit = parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 12;
    const page = parseInt(req.query.page, 10) >= 0 ? parseInt(req.query.page, 10) : 0;

    const pageString = res.__('pagination.currentPage', {
      number: page + 1
    });

    if (title) {
      title += ` - ${pageString}`;
    } else {
      title = pageString;
    }

    r.table('bots')
      .merge(bot => r.branch(bot('contents').hasFields(res.getLocale()), {
        random: bot('random').add(10)
      }, {}))
      .orderBy(r.desc('random'))
      .filter(filter || {})
      .skip(limit * page)
      .limit(limit + 1) // 1 more for checking next page
      .then((list) => {
        res.render('list', {
          list: list.map(item => localise(item, res)),
          page,
          limit,
          previous: page - 1,
          next: page + 1,
          state,
          title,
          query,
          category
        });
      })
      .catch((err) => {
        next(err);
      });
  };

  if (options.filter === 'search') {
    title = res.__('pages.bots.search');
    filter = (bot) => {
      let orChain = r.expr(sanitise(query)).match(bot('category'))
        .or(bot('nsfw').and(r.expr(sanitise(query)).match('nsfw')));

      for (let i = 0; i < selectableLanguages.length; i += 1) {
        orChain = orChain.or(bot('contents')(selectableLanguages[i])('page').default('').match(sanitise(query)))
          .or(bot('contents')(selectableLanguages[i])('name').default('').match(sanitise(query)))
          .or(bot('contents')(selectableLanguages[i])('description').default('').match(sanitise(query)));
      }

      let databaseQuery = bot('state').eq(state).and(orChain);

      if (categories.includes(category)) {
        databaseQuery = databaseQuery.and(bot('category').eq(category));
      }

      for (let i = 0; i < owners.length; i += 1) {
        databaseQuery = databaseQuery.and(bot('authors').contains(owners[i]));
      }

      return databaseQuery;
    };

    checkDatabase();
  } else {
    checkDatabase();
  }
};

module.exports = {
  listMiddleware,
  localise
};
