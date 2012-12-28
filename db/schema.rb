# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 0) do

  create_table "altnames", :id => false, :force => true do |t|
    t.text "oldcode", :limit => 255, :null => false
    t.text "newcode", :limit => 255, :null => false
    t.text "level",   :limit => 255, :null => false
  end

  create_table "doma", :id => false, :force => true do |t|
    t.text "name",   :limit => 255, :null => false
    t.text "korp",   :limit => 255, :null => false
    t.text "socr",   :limit => 255, :null => false
    t.text "code",   :limit => 255, :null => false
    t.text "index",  :limit => 255, :null => false
    t.text "gninmb", :limit => 255, :null => false
    t.text "uno",    :limit => 255, :null => false
    t.text "ocatd",  :limit => 255, :null => false
  end

  create_table "flat", :id => false, :force => true do |t|
    t.text "name",   :limit => 255, :null => false
    t.text "code",   :limit => 255, :null => false
    t.text "index",  :limit => 255, :null => false
    t.text "gninmb", :limit => 255, :null => false
    t.text "uno",    :limit => 255, :null => false
    t.text "np",     :limit => 255, :null => false
  end

  create_table "kladr", :id => false, :force => true do |t|
    t.text "name",   :limit => 255, :null => false
    t.text "socr",   :limit => 255, :null => false
    t.text "code",   :limit => 255, :null => false
    t.text "index",  :limit => 255, :null => false
    t.text "gninmb", :limit => 255, :null => false
    t.text "uno",    :limit => 255, :null => false
    t.text "ocatd",  :limit => 255, :null => false
    t.text "status", :limit => 255, :null => false
  end

  create_table "socrbase", :id => false, :force => true do |t|
    t.text "level",    :limit => 255, :null => false
    t.text "scname",   :limit => 255, :null => false
    t.text "socrname", :limit => 255, :null => false
    t.text "kod_t_st", :limit => 255, :null => false
  end

  create_table "street", :id => false, :force => true do |t|
    t.text "name",   :limit => 255, :null => false
    t.text "socr",   :limit => 255, :null => false
    t.text "code",   :limit => 255, :null => false
    t.text "index",  :limit => 255, :null => false
    t.text "gninmb", :limit => 255, :null => false
    t.text "uno",    :limit => 255, :null => false
    t.text "ocatd",  :limit => 255, :null => false
  end

end
