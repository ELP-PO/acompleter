class KladrController < ApplicationController
  def list
    if params[:code].nil? or params[:code].length == 0
      @items = get_states(params[:q])
    elsif [ 2, # state provided
            5, # district provided
            8  # city provided
            ].include?(params[:code].length)
      @items = get_kladr(params[:code], params[:q])
    elsif params[:code].length == 11 # locality provided
      @items = get_streets(params[:code], params[:q])
    elsif params[:code].length == 15 # street provided
      @items = get_buildings(params[:code], params[:q])
    end
    
    respond_to do |format|
      format.html # list.html.erb
      format.json { render :json => @items }
    end
  end
  
  def form
    respond_to do |format|
      format.html
    end
  end  
  
  def get_states(q = "")
    if q.nil?
      q = ""
    end
    return Kladr.where("code like '__00000000000' AND name like concat('%', concat(?, '%'))", q).order("name")
  end
  
  def get_kladr(code, q = "")
    if q.nil?
      q = ""
    end
    mask = (code + "___").ljust(13, "0")
    exclude = code.ljust(13, "0")
    return Kladr.where("code like ? AND code <> ? AND name like concat('%', concat(?, '%'))", mask, exclude, q).order("name")
  end
  
  def get_streets(code, q = "")
    if q.nil?
      q = ""
    end
    mask = (code + "____").ljust(17, "0")
    return Street.where("code like ? AND name like concat('%', concat(?, '%'))", mask, q).order("name")
  end
  
  def get_buildings(code, q = "")
    if q.nil?
      q = ""
    end
    mask = code + "____"
    buildings = Doma.where("code like ? AND name like concat('%', concat(?, '%'))", mask, q).order("code")
    
    buildings = buildings.map {|record|
        record.name.split(",").map {|b| {:name => b, :code => record.code, :index => record.index, :socr => record.socr }}
      }.flatten.sort_by {|b| b[:name].to_i }
    
    
    return buildings
  end
  
end