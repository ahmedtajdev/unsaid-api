const applyQueryOptions = (query, options = {}) => {
  const { select, populate, sort, skip, limit, lean, session } = options;

  if (select) query.select(select);

  if (populate) query.populate(populate);

  if (sort) query.sort(sort);

  if (skip !== undefined) query.skip(skip);

  if (limit !== undefined) query.limit(limit);

  if (lean) query.lean();

  if (session) query.session(session);

  return query;
};

export const find = async ({ model, filter = {}, options = {} } = {}) => {
  const query = model.find(filter);

  applyQueryOptions(query, options);

  return query.exec();
};

export const findOne = async ({ model, filter = {}, options = {} } = {}) => {
  const query = model.findOne(filter);

  applyQueryOptions(query, options);

  return query.exec();
};

export const findById = async ({ model, id, options = {} } = {}) => {
  const query = model.findById(id);

  applyQueryOptions(query, options);

  return query.exec();
};

export const createOne = async ({ model, data = {}, options = {} } = {}) => {
  return model.create(data, {
    validateBeforeSave: true,
    ...options,
  });
};

export const create = async ({ model, data = [], options = {} } = {}) => {
  return model.create(data, options);
};

export const insertMany = async ({ model, data = [], options = {} } = {}) => {
  return model.insertMany(data, options);
};

export const updateOne = async ({
  model,
  filter = {},
  update,
  options = {},
} = {}) => {
  return model
    .updateOne(filter, update, {
      runValidators: true,
      ...options,
    })
    .exec();
};

export const findOneAndUpdate = async ({
  model,
  filter = {},
  update,
  options = {},
} = {}) => {
  return model
    .findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
      ...options,
    })
    .exec();
};

export const findByIdAndUpdate = async ({
  model,
  id,
  update,
  options = {},
} = {}) => {
  return model
    .findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      ...options,
    })
    .exec();
};

export const deleteOne = async ({ model, filter = {} } = {}) => {
  return model.deleteOne(filter).exec();
};

export const findOneAndDelete = async ({ model, filter = {} } = {}) => {
  return model.findOneAndDelete(filter).exec();
};

export const count = async ({ model, filter = {} } = {}) => {
  return model.countDocuments(filter).exec();
};
