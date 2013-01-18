class KladrController < ApplicationController
  def list
    if params[:code].nil? or params[:code].length == 0
      @items = get_states(params[:q])
    elsif params[:code].length == 2 # state provided
      @items = get_districts(params[:code], params[:q])
    end
    
    respond_to do |format|
      format.html # list.html.erb
      format.json { render :json => @items }
  #    format.json { render :json => params[:q] }
    end
  end
  
  def form
    respond_to do |format|
      format.html # form.html.erb
    end
  end
  
  
  def get_states(q = "")
    if q.nil?
      q = ""
    end
    return Kladr.where("code like '__00000000000' AND name like concat('%', concat(?, '%'))", q).order("name")
  end
  
  def get_districts(code, q = "")
    if q.nil?
      q = ""
    end
    return Kladr.where("code like concat(?, '___00000000') AND code <> concat(?, '00000000000') AND name like concat('%', concat(?, '%'))", code, code, q).order("name")
  end

end
